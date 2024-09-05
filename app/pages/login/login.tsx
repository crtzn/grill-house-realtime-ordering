"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";

function login() {
  const [user, setUsernname] = useState("admin");
  const [password, setPassword] = useState("admin");
  return (
    <div className="flex justify-center items-center">
      <div>
        <h1>Login page</h1>
        <Input></Input>
      </div>
    </div>
  );
}

export default login;
