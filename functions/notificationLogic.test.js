"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { missionParticipationChange } = require("./notificationLogic");

test("detecta um jogador entrando sem lotar", () => {
  const result = missionParticipationChange(
    { participants: {}, maxPlayers: 3 },
    { participants: { player1: { uid: "player1", displayName: "Alex" } }, maxPlayers: 3 },
  );
  assert.equal(result.addedParticipants.length, 1);
  assert.equal(result.addedParticipants[0].displayName, "Alex");
  assert.equal(result.becameFull, false);
});

test("detecta entrada que completa a missão", () => {
  const result = missionParticipationChange(
    { participants: { player1: { uid: "player1" } }, maxPlayers: 2 },
    {
      participants: {
        player1: { uid: "player1" },
        player2: { uid: "player2", displayName: "Bia" },
      },
      maxPlayers: 2,
    },
  );
  assert.equal(result.addedParticipants.length, 1);
  assert.equal(result.afterCount, 2);
  assert.equal(result.becameFull, true);
});

test("saída de jogador não dispara e-mail", () => {
  const result = missionParticipationChange(
    {
      participants: {
        player1: { uid: "player1" },
        player2: { uid: "player2" },
      },
      maxPlayers: 2,
    },
    { participants: { player1: { uid: "player1" } }, maxPlayers: 2 },
  );
  assert.equal(result.addedParticipants.length, 0);
  assert.equal(result.becameFull, false);
});
