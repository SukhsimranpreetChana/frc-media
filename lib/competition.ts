export const currentCompetitionNumber = 1;
export const currentCompetitionDeadline = "2026-09-07T23:59:59-04:00";

export function isCurrentCompetitionOpen(now = Date.now()) {
  return now <= new Date(currentCompetitionDeadline).getTime();
}
