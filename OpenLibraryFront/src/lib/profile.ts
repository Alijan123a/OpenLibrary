"use client";

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://127.0.0.1:8002";

export interface Profile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  student_number: string;
  role: string;
  date_joined: string;
}

function getToken(): string {
  const token = localStorage.getItem("jwt");
  if (!token) throw new Error("Not authenticated");
  return token;
}

export async function getProfile(): Promise<Profile> {
  const res = await fetch(`${AUTH_BASE_URL}/api/profile/`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `خطا در دریافت پروفایل: ${res.status}`);
  }
  return res.json();
}

export async function updateProfile(
  data: Partial<{ email: string; first_name: string; last_name: string; phone_number: string }>
): Promise<Profile> {
  const res = await fetch(`${AUTH_BASE_URL}/api/profile/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.detail || `خطا در به‌روزرسانی پروفایل: ${res.status}`);
  }
  return res.json();
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<string> {
  const res = await fetch(`${AUTH_BASE_URL}/api/change-password/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `خطا در تغییر رمز: ${res.status}`);
  }
  return data.detail || "رمز عبور تغییر کرد.";
}
