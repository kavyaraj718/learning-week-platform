/**
 * Thin wrapper around the Socket.IO server instance so controllers/services can
 * emit domain events without importing the io object everywhere.
 */

export const EVENTS = {
  LEADERBOARD_UPDATE: 'leaderboard:update',
  POINTS_UPDATE: 'points:update',
  ACTIVITY_UPDATE: 'activity:update',
  STATS_UPDATE: 'stats:update',
  RECOGNITION_UPDATE: 'recognition:update',
};

let io = null;

export const setIO = (instance) => {
  io = instance;
};

export const getIO = () => io;

const emit = (event, payload = {}) => {
  if (io) io.emit(event, { ...payload, at: Date.now() });
};

/** Call after anything that can change rankings. */
export const emitLeaderboardUpdate = (payload) => emit(EVENTS.LEADERBOARD_UPDATE, payload);
export const emitPointsUpdate = (payload) => emit(EVENTS.POINTS_UPDATE, payload);
export const emitActivityUpdate = (payload) => emit(EVENTS.ACTIVITY_UPDATE, payload);
export const emitStatsUpdate = (payload) => emit(EVENTS.STATS_UPDATE, payload);
export const emitRecognitionUpdate = (payload) => emit(EVENTS.RECOGNITION_UPDATE, payload);

/**
 * Broadcast the full set of "something changed" events at once. Most mutations
 * affect points, the leaderboard, live stats, and recognition together.
 */
export const broadcastChange = (payload = {}) => {
  emitPointsUpdate(payload);
  emitLeaderboardUpdate(payload);
  emitStatsUpdate(payload);
  emitRecognitionUpdate(payload);
};

export default {
  EVENTS,
  setIO,
  getIO,
  emitLeaderboardUpdate,
  emitPointsUpdate,
  emitActivityUpdate,
  emitStatsUpdate,
  emitRecognitionUpdate,
  broadcastChange,
};
