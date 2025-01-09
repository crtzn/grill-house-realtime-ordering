"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import supabase from "@/lib/supabaseClient";
import { setCookie } from "cookies-next";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [login, setLogin] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username === "admin" && password === "admin") {
      // Set authentication cookie
      document.cookie = "authenticated=true; path=/admin";
      document.cookie = "userRole=admin; path=/";
      router.push("/admin");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex-1">
        <Card className="w-[350px] mx-auto mt-20">
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="border-0 border-b-2 border-b-[#111111]"
                />
              </div>
              <div className="mb-4">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-0 border-b-2 border-b-[#111111]"
                />
              </div>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full bg-black text-white active:bg-[#111111] hover:bg-[#212121] rounded-xl p-5 drop-shadow-xl"
              >
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="flex-1">Side image here</div>
    </div>
  );
};

export default Login;
