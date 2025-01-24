import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Logo from "@/assets/logo.png";

export default function ExpiredQRPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <Image src={Logo} alt="logo" width={500} height={500}></Image>
        <h1 className="text-4xl font-bold mb-4">QR Code Expired</h1>
        <p className="text-xl mb-8">
          This QR code has expired or is no longer valid.
        </p>
      </div>
    </div>
  );
}
