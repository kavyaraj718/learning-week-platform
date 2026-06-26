/**
 * Centralized constants and default values used across the app.
 * Point values here are only DEFAULTS — the live values are stored in the
 * PointsConfig collection and editable by admins.
 */

export const DEFAULT_PARTICIPATION_POINTS = 5;

export const DEFAULT_WINNER_POINTS = {
  first: 50,
  second: 30,
  third: 10,
};

export const POINT_SOURCES = ['participation', 'winner', 'bonus', 'social'];

export const ACTIVITY_TYPES = ['Virtual', 'On-Ground'];

export const REGISTRATION_STATUS = ['enrolled', 'attended', 'completed', 'won'];

export const ROLES = ['employee', 'admin'];

// Award/badge keys used by the recognition module
export const BADGES = {
  WINNER: 'Activity Winner',
  CHAMPION: 'Learning Week Champion',
  ENGAGED: 'Most Engaged',
  SOCIAL: 'Social Engagement Champion',
  CONSISTENCY: 'Consistency Award',
};

export default {
  DEFAULT_PARTICIPATION_POINTS,
  DEFAULT_WINNER_POINTS,
  POINT_SOURCES,
  ACTIVITY_TYPES,
  REGISTRATION_STATUS,
  ROLES,
  BADGES,
};
