// /components/LogoutButton.tsx
"use client";

import React from "react";
import { logout } from "@/lib/auth";

export default function LogoutButton() {
  const handleLogout = () => {
    logout();
  };

  return (
    <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}>
      Logout
    </button>
  );
}