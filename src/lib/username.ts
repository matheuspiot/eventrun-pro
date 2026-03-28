export const usernamePattern = /^[a-z0-9._-]{3,24}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return usernamePattern.test(normalizeUsername(value));
}
