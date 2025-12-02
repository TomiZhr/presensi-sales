"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const loginButtonRef = useRef<HTMLButtonElement>(null);

  // 🔥 Load rememberMe + saved email/password saat page pertama dibuka
  useEffect(() => {
    const savedRemember = localStorage.getItem("rememberMe");
    const savedEmail = localStorage.getItem("rememberEmail");
    const savedPassword = localStorage.getItem("rememberPassword");

    if (savedRemember === "true") {
      setRememberMe(true);

      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(atob(savedPassword)); // decode password
    }
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Email dan password wajib diisi!");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email atau password salah!");
      setLoading(false);
      return;
    }

    // 🔥 Simpan Remember Me
    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("rememberEmail", email);

      // password disimpan dgn base64, tidak polos
      localStorage.setItem("rememberPassword", btoa(password));

      document.cookie = `sb-remember=true; max-age=${7 * 24 * 60 * 60}; path=/`;
    } else {
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("rememberEmail");
      localStorage.removeItem("rememberPassword");

      document.cookie = `sb-remember=; max-age=0; path=/`;
    }

    // Token untuk middleware
    document.cookie = `token=loggedin; path=/`;

    router.push("/admin");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-10"></div>

      <div className="mb-8 animate-fade-in">
        <img src="/logo.png" alt="Logo" className="h-24 w-auto drop-shadow-lg" />
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>

        <CardHeader className="text-center pt-8 pb-6">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Admin Login
          </CardTitle>
          <p className="text-gray-500 mt-2 text-sm">Masukkan email dan password</p>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-8">
          {error && (
            <div className="p-4 rounded-lg bg-red-50/80 border border-red-200 text-red-700 text-sm flex gap-3 animate-shake">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Email Address</label>
            <Input
              placeholder="name@admin.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") passwordRef.current?.focus();
              }}
              className="h-12 bg-gray-50/80 border border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              ref={passwordRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loginButtonRef.current?.click();
              }}
              className="h-12 bg-gray-50/80 border border-gray-200"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
            />
            <span>Ingat saya selama 7 hari</span>
          </label>

          <Button
            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg"
            onClick={handleLogin}
            disabled={loading}
            ref={loginButtonRef}
          >
            {loading ? "Sedang masuk..." : "Masuk"}
          </Button>
        </CardContent>
      </Card>

      <p className="mt-8 text-gray-500 text-sm">
        © 2025 Presensi Sales. All rights reserved.
      </p>
    </div>
  );
}
