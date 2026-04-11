export const APP_NAME = "West End Sports Club";
export const APP_SHORT_NAME = "WESC";
export const APP_DESCRIPTION =
  "West End Sports Club — team management and attendance platform";

export const DEFAULT_SPORTS = [
  "Handball",
  "Football",
  "Futsal",
  "Basketball",
  "Beach Volleyball",
  "Beach Handball",
] as const;

export const SESSION_DURATIONS = [30, 45, 60, 75, 90, 120] as const;

export const ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
] as const;
