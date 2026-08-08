/**
 * ABI for HallConfirmation.sol (see /contracts). Kept in sync by hand —
 * it's a two-function contract, see the Solidity source for the
 * authoritative definition.
 */
export const HALL_CONFIRMATION_ABI = [
  "function confirmTotal(string hallSlug, string currency, uint256 totalSubunits, string note) external",
  "event Confirmed(string hallSlug, string currency, uint256 totalSubunits, string note, uint256 timestamp)",
  "function owner() external view returns (address)",
] as const;
