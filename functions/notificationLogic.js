"use strict";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function missionParticipationChange(before, after) {
  const beforeParticipants = asObject(before?.participants);
  const afterParticipants = asObject(after?.participants);
  const addedParticipants = Object.entries(afterParticipants)
    .filter(([uid]) => !Object.prototype.hasOwnProperty.call(beforeParticipants, uid))
    .map(([, participant]) => asObject(participant));
  const maxPlayers = Math.max(1, Number(after?.maxPlayers) || 1);
  const beforeCount = Object.keys(beforeParticipants).length;
  const afterCount = Object.keys(afterParticipants).length;

  return {
    addedParticipants,
    maxPlayers,
    beforeCount,
    afterCount,
    becameFull: addedParticipants.length > 0 && beforeCount < maxPlayers && afterCount >= maxPlayers,
  };
}

module.exports = {
  missionParticipationChange,
};
