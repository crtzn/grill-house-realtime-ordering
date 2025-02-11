import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Logo from "@/public/assets/Logo.png";

export default function ExpiredQRPage() {
  return (
    <div className="flex flex-col items-center align-middle justify-center min-h-screen text-center bg-gray-100">
      <Image src={Logo} alt="logo" width={500} height={500}></Image>
      <h1 className="text-4xl font-bold mb-4">QR Code Expired</h1>
      <p className="text-xl mb-8">
        Your ordering session has ended. We appreciate your visit—thank you!
      </p>
    </div>
  );
}
