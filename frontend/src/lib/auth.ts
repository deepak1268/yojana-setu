const KEY = "ys_authed";
const NAME_KEY = "ys_name";

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem("token") || window.localStorage.getItem(KEY) === "true");
}

export function getUser(): { id?: string; name?: string; email?: string; profilePicture?: string } | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function signIn(name?: string, token?: string): void {
  window.localStorage.setItem(KEY, "true");
  if (token) window.localStorage.setItem("token", token);
  if (name) {
    window.localStorage.setItem(NAME_KEY, name);
    window.localStorage.setItem("user", JSON.stringify({ name }));
  }
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("user");
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(NAME_KEY);
}

export function getUserName(): string {
  if (typeof window === "undefined") return "";
  const user = getUser();
  if (user?.name) return user.name;
  return window.localStorage.getItem(NAME_KEY) ?? "";
}