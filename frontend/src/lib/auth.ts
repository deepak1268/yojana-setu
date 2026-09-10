const KEY = "ys_authed";
const NAME_KEY = "ys_name";

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "true";
}

export function signIn(name?: string): void {
  window.localStorage.setItem(KEY, "true");
  if (name) window.localStorage.setItem(NAME_KEY, name);
}

export function signOut(): void {
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(NAME_KEY);
}

export function getUserName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}