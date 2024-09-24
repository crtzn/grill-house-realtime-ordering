import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavProps {
  links: {
    title: string;
    label?: string;
    href: string;
  };
}

function Navlinks({ links }: NavProps) {
  const pathname = usePathname();

  return (
    <div>
      <div className="  sticky top-0 bg-white shadow">
        <div className=" flex gap-5 h-[5rem] items-center">
          <Link className={`link`} href={""}></Link>
        </div>
      </div>
    </div>
  );
}

export default Navlinks;
