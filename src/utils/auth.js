export function getCurrentUser() {
  const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function isAdmin() {
  const me = getCurrentUser();
  return me?.role === "ADMIN";
}