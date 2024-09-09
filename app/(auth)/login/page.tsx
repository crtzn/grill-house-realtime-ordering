import React from "react";
import AuthForm from "@/components/AuthForm";

function Login({ type }: { type: string }) {
  return (
    <div className="flex items-center justify-center">
      <AuthForm type="Login" />
    </div>
  );
}

export default Login;
