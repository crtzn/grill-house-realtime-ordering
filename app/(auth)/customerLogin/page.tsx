"use client";

import React, { useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { set } from "react-hook-form";
import { setCookie } from "cookies-next";

const LoginPage: React.FC = () => {
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("device_table")
      .select()
      .eq("device_id", deviceId)
      .single();

    if (error) {
      console.error("Error:", error);
    } else if (data) {
      // Device exists, set cookie and proceed to main ordering page
      setCookie("device_id", deviceId, { maxAge: 60 * 60 * 24 }); // 24 hours
      router.push(`/customer`);
    }
  };

  return (
    <div>
      <div className="flex justify-center items-center  h-screen">
        <Card className="w-[350px] mx-auto mt-20">
          <CardHeader>
            <CardTitle>Device Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Enter Device ID"
                className="border h-[2rem] p-2 focus:outline-none"
              />
              <Button className="bg-black text-white hover:bg-gray-500 hover:text-black">
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
