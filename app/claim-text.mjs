// Formatting only: never add employers, collaborators, skills or metrics.
export function cleanClaim(claim) {
  return claim.trim().replace(/\s+/g, ' ');
}
