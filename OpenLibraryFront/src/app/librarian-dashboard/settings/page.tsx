"use client";

import DashboardLayout from "@/components/DashboardLayout";
import ProfileSettings from "@/components/ProfileSettings";

export default function LibrarianSettingsPage() {
  return (
    <DashboardLayout allowedRoles={["librarian"]}>
      <ProfileSettings />
    </DashboardLayout>
  );
}
