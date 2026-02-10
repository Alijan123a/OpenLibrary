"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/auth";
import { checkRole } from "@/lib/role";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const token = await loginUser(username, password);

    setLoading(false);

    if (token) {
      localStorage.setItem("jwt", token);
      const role = await checkRole(token);
      if (role === "librarian" || role === "admin") router.push("/librarian-dashboard");
      else if (role === "student") router.push("/student-dashboard");
      else router.push("/unauthorized");
    } else {
      setError("نام کاربری یا گذرواژه نامعتبر است.");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">ورود</h2>

        {error && (
          <p className="mb-4 text-red-500 text-sm text-center">{error}</p>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">نام کاربری</label>
          <input
            type="text"
            placeholder="نام کاربری خود را وارد کنید"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black text-base"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">گذرواژه</label>
          <input
            type="password"
            placeholder="گذرواژه خود را وارد کنید"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black text-base"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
        >
          {loading ? "در حال ورود..." : "ورود"}
        </button>
      </form>
    </div>
  );
}
