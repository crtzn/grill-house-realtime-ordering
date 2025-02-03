// pages/login.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react"; // Import Loader2 for the spinner
import Image from "next/image";
import Logo from "@/public/assets/Logo.png";
import supabase from "@/lib/supabaseClient";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Add loading state
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true); // Set loading to true when login starts

    try {
      // Direct database query to check credentials
      const { data: user, error: userError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single();

      if (userError || !user) {
        setError("Invalid credentials or user not found");
        setLoading(false); // Set loading to false on error
        return;
      }

      // Store user info in a cookie
      document.cookie = `adminUser=${JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
      })}; path=/`;

      // Redirect based on role
      switch (user.role) {
        case "admin":
          router.push("/admin");
          break;
        case "kitchen":
          router.push("/admin/order");
          break;
        case "staff":
          router.push("/admin/order");
          break;
        default:
          setError("Invalid user role");
          setLoading(false); // Set loading to false on invalid role
      }
    } catch (err) {
      setError("An error occurred during login");
      console.error(err);
      setLoading(false); // Set loading to false on error
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex justify-center py-6">
          <Image
            src={Logo}
            alt="Logo"
            width={200}
            height={200}
            className="object-contain"
          />
        </div>
        <div className="px-8 pb-8 space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center tracking-tight">
            Welcome Back
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-500 transition-all duration-300"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-500 transition-all duration-300"
            />
            {error && (
              <div className="flex items-center text-red-600 space-x-2 animate-pulse">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading} // Disable the button when loading
              className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-xl transition-colors duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" /> // Show spinner when loading
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="text-center text-gray-500 text-sm">
            Forgot password? Contact admin
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
