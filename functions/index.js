"use strict";

const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { defineSecret } = require("firebase-functions/params");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const nodemailer = require("nodemailer");
const { missionParticipationChange } = require("./notificationLogic");

initializeApp();

const NOTIFICATION_EMAIL = "supacell28@gmail.com";
const GMAIL_APP_PASSWORD = defineSecret("SUPACELL_GMAIL_APP_PASSWORD");
const EVENT_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

function safeText(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function claimEvent(eventRef, eventId) {
  const db = getFirestore();
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(eventRef);
    if (snapshot.exists) {
      const data = snapshot.data();
      if (data.status === "sent") return false;
      const updatedAtMs = Number(data.updatedAtMs) || 0;
      if (data.status === "processing" && Date.now() - updatedAtMs < EVENT_LOCK_TIMEOUT_MS) {
        return false;
      }
    }

    transaction.set(eventRef, {
      eventId,
      status: "processing",
      updatedAtMs: Date.now(),
      attempts: FieldValue.increment(1),
    }, { merge: true });
    return true;
  });
}

function createTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: NOTIFICATION_EMAIL,
      pass: GMAIL_APP_PASSWORD.value(),
    },
  });
}

async function sendParticipationEmail(transport, campaignName, missionName, participantName) {
  const sentence = `A pessoa ${participantName} está à espera da missão ${missionName} e quer que você mestre para ela.`;
  await transport.sendMail({
    from: `"Supacell RPG" <${NOTIFICATION_EMAIL}>`,
    to: NOTIFICATION_EMAIL,
    subject: `Supacell — ${participantName} entrou em ${missionName}`,
    text: `${sentence}\n\nCampanha: ${campaignName}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#080b0b;color:#edf1ed;padding:28px">
        <p style="margin:0 0 8px;color:#c8ff2e;font-size:12px;font-weight:800;letter-spacing:.12em">NOVA PARTICIPAÇÃO</p>
        <h1 style="margin:0 0 18px;font-size:26px">${escapeHtml(missionName)}</h1>
        <p style="font-size:16px;line-height:1.55">${escapeHtml(sentence)}</p>
        <p style="margin-top:20px;color:#9aa4a4">Campanha: ${escapeHtml(campaignName)}</p>
      </div>
    `,
  });
}

async function sendFullMissionEmail(transport, campaignName, missionName, currentPlayers, maxPlayers) {
  const alert = "A MISSÃO ESTÁ CHEIA DE VIDA, E ESTÁ A ESPERA DE UM MESTRE PARA QUE SE TORNE POSSÍVEL CONCLUI-LA!";
  await transport.sendMail({
    from: `"Supacell RPG" <${NOTIFICATION_EMAIL}>`,
    to: NOTIFICATION_EMAIL,
    subject: `Supacell — missão lotada: ${missionName}`,
    text: `${alert}\n\nMissão: ${missionName}\nCampanha: ${campaignName}\nEquipe: ${currentPlayers}/${maxPlayers}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#080b0b;color:#edf1ed;padding:28px">
        <p style="margin:0 0 8px;color:#ff5757;font-size:12px;font-weight:800;letter-spacing:.12em">MISSÃO LOTADA</p>
        <h1 style="margin:0 0 18px;font-size:26px">${escapeHtml(missionName)}</h1>
        <p style="font-size:18px;font-weight:800;line-height:1.5">${alert}</p>
        <p style="margin-top:20px;color:#9aa4a4">Campanha: ${escapeHtml(campaignName)} · Equipe: ${currentPlayers}/${maxPlayers}</p>
      </div>
    `,
  });
}

exports.notifyMissionParticipation = onDocumentUpdated(
  {
    document: "campaigns/{campaignId}/missions/{missionId}",
    region: "southamerica-east1",
    secrets: [GMAIL_APP_PASSWORD],
    retry: true,
    timeoutSeconds: 60,
    maxInstances: 2,
  },
  async (event) => {
    if (!event.data) return;

    const before = event.data.before.data();
    const after = event.data.after.data();
    const {
      addedParticipants,
      maxPlayers,
      afterCount,
      becameFull,
    } = missionParticipationChange(before, after);

    if (!addedParticipants.length) return;

    const missionName = safeText(after.title, "Missão sem nome");
    const campaignId = event.params.campaignId;
    const eventId = safeText(event.id, `${campaignId}-${event.params.missionId}-${Date.now()}`);
    const db = getFirestore();
    const eventRef = db.doc(`campaigns/${campaignId}/emailEvents/${eventId.replaceAll("/", "_")}`);

    if (!await claimEvent(eventRef, eventId)) return;

    try {
      const campaignSnapshot = await db.doc(`campaigns/${campaignId}`).get();
      const campaignName = safeText(campaignSnapshot.data()?.name, "Campanha Supacell");
      const transport = createTransport();

      for (const participant of addedParticipants) {
        await sendParticipationEmail(
          transport,
          campaignName,
          missionName,
          safeText(participant.displayName, "Um jogador"),
        );
      }

      if (becameFull) {
        await sendFullMissionEmail(transport, campaignName, missionName, afterCount, maxPlayers);
      }

      await eventRef.set({
        status: "sent",
        updatedAtMs: Date.now(),
        sentAt: FieldValue.serverTimestamp(),
        messageCount: addedParticipants.length + (becameFull ? 1 : 0),
      }, { merge: true });
    } catch (error) {
      logger.error("Falha ao enviar notificação de missão", {
        campaignId,
        missionId: event.params.missionId,
        eventId,
        error,
      });
      await eventRef.set({
        status: "failed",
        updatedAtMs: Date.now(),
        error: error instanceof Error ? error.message.slice(0, 500) : "unknown-error",
      }, { merge: true });
      throw error;
    }
  },
);
