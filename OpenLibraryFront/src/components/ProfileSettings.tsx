"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getProfile, updateProfile, changePassword, type Profile } from "@/lib/profile";

const ROLE_LABELS: Record<string, string> = {
  student: "دانشجو",
  librarian: "کتابدار",
  admin: "مدیر سیستم",
};

export default function ProfileSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Profile form
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setEmail(p.email);
        setFirstName(p.first_name);
        setLastName(p.last_name);
        setPhone(p.phone_number);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updated = await updateProfile({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim(),
      });
      setProfile(updated);
      setProfileMsg({ type: "success", text: "اطلاعات با موفقیت ذخیره شد." });
    } catch (err: unknown) {
      setProfileMsg({ type: "error", text: err instanceof Error ? err.message : "خطا" });
    }
    setProfileSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (!oldPassword || !newPassword) {
      setPwMsg({ type: "error", text: "رمز فعلی و رمز جدید الزامی هستند." });
      return;
    }
    if (newPassword.length < 4) {
      setPwMsg({ type: "error", text: "رمز جدید باید حداقل ۴ کاراکتر باشد." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "رمز جدید و تکرار آن مطابقت ندارند." });
      return;
    }
    setPwSaving(true);
    try {
      const msg = await changePassword(oldPassword, newPassword);
      setPwMsg({ type: "success", text: msg });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPwMsg({ type: "error", text: err instanceof Error ? err.message : "خطا" });
    }
    setPwSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>;

  return (
    <div>
      <PageHeader title="تنظیمات پروفایل" description="مدیریت اطلاعات حساب کاربری و تغییر رمز عبور" />

      {/* Read-only info */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">اطلاعات حساب</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-gray-700">
          <div>نام کاربری: <span className="font-medium">{profile?.username}</span></div>
          <div>نقش: <span className="font-medium">{ROLE_LABELS[profile?.role || ""] || profile?.role}</span></div>
          {profile?.student_number && (
            <div>شماره دانشجویی: <span className="font-medium">{profile.student_number}</span></div>
          )}
          <div>تاریخ عضویت: <span className="font-medium">{profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString("fa-IR") : "—"}</span></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile edit form */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">ویرایش اطلاعات</h2>
          {profileMsg && (
            <div className={`mb-3 text-sm px-3 py-2 rounded border ${profileMsg.type === "success" ? "text-green-700 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"}`}>
              {profileMsg.text}
            </div>
          )}
          <form onSubmit={handleProfileSave} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">نام</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">نام خانوادگی</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ایمیل</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">شماره تلفن</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 09121234567"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50"
            >
              {profileSaving ? "ذخیره..." : "ذخیره تغییرات"}
            </button>
          </form>
        </div>

        {/* Password change form */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">تغییر رمز عبور</h2>
          {pwMsg && (
            <div className={`mb-3 text-sm px-3 py-2 rounded border ${pwMsg.type === "success" ? "text-green-700 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"}`}>
              {pwMsg.text}
            </div>
          )}
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">رمز فعلی *</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">رمز جدید *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">تکرار رمز جدید *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={pwSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50"
            >
              {pwSaving ? "تغییر..." : "تغییر رمز عبور"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
