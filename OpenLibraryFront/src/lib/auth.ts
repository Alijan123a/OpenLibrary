"use client";

export type LoginResult = { success: true; token: string } | { success: false; error: "network" | "invalid" } | null;

export async function loginUser(username: string, password: string): Promise<LoginResult> {
  try {
    const loginApi = process.env.NEXT_PUBLIC_LOGIN_API;
    if (!loginApi) {
      return { success: false, error: "network" };
    }
    const res = await fetch(loginApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: "invalid" };
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("jwt", data.access);
      localStorage.setItem("refreshToken", data.refresh);
    }

    return { success: true, token: data.access };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "network" };
  }
}

export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("jwt") || null;
  }
  return null;
}

/** Returns headers with Bearer token for main backend API calls. */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("jwt");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  }
}

export function isTokenExpired(token: string) {
  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.exp * 1000 < Date.now();
}

/** If refresh token is missing or expired, logs out. Does not yet call Auth Service refresh endpoint. */
export function validateRefreshToken(): void {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("refreshToken");
  if (!token || isTokenExpired(token)) {
    logout();
  }
}