export function homeSignupLabel(copy, row) {
  if (!row?.open) return copy.detail;
  if (row?.share) return copy.open;
  return typeof copy.lgGo === "function" ? copy.lgGo(row?.name || "") : copy.detail;
}
