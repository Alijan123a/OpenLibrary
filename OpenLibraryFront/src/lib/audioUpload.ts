"use client";

import { getAuthToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface AudioUpload {
  id: number;
  file: string;
  title: string;
  created_at: string;
  borrower_username: string | null;
}

/** Upload an audio file. */
export async function uploadAudioFile(file: File, title?: string): Promise<AudioUpload> {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);

  const res = await fetch(`${API_BASE_URL}/api/audio-uploads/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || data.file?.[0] || `Upload failed: ${res.status}`);
  }
  return res.json();
}
