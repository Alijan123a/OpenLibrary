"use client";

import DashboardLayout from "@/components/DashboardLayout";
import ProfileSettings from "@/components/ProfileSettings";

export default function StudentSettingsPage() {
  return (
    <DashboardLayout allowedRoles={["student"]}>
      <ProfileSettings />
    </DashboardLayout>
  );
}
