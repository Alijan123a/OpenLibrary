"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { uploadAudioFile } from "@/lib/audioUpload";

function UploadContent() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      await uploadAudioFile(file, title || undefined);
      setSubmitted(true);
      setFile(null);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در آپلود فایل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="آپلود کتاب صوتی" description="فایل صوتی کتاب را برای بارگذاری انتخاب کنید" />

      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">فایل با موفقیت ارسال شد</h3>
              <p className="text-xs text-gray-500 mb-4">فایل شما برای بررسی ارسال شده است.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ارسال فایل دیگر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">عنوان (اختیاری)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان کتاب صوتی"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">فایل صوتی</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="audio-file"
                  />
                  <label htmlFor="audio-file" className="cursor-pointer">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      {file ? file.name : "برای انتخاب فایل کلیک کنید"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">فرمت‌های پشتیبانی شده: MP3, WAV, OGG</p>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-40"
              >
                {loading ? "در حال ارسال..." : "ارسال فایل"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <DashboardLayout allowedRoles={["student"]}>
      <UploadContent />
    </DashboardLayout>
  );
}
