"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ListOrdered,
  SquareMenu,
  TabletSmartphone,
} from "lucide-react";
import { Nav } from "@/components/nav";
import Image from "next/image";
import { useWindowWidth } from "@react-hook/window-size";
import { getUserRole } from "@/app/utils/getUserRoles"; // Adjust the import path
import { filterLinks } from "@/app/utils/filterLink"; // Adjust the import path

export default function SideNavbar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const mobileWidth = useWindowWidth();

  useEffect(() => {
    setIsMobile(mobileWidth < 768);
    const role = getUserRole(); // Fetch user role
    setUserRole(role);
  }, [mobileWidth]);

  const filteredLinks = filterLinks(userRole); // Filter links based on role

  return (
    <div className="flex flex-col items-center relative min-w-[80px] border-r px-3 pb-5 pt-10">
      <Image
        src="/assets/Logo.png"
        width={80}
        height={80}
        alt="Logo"
        priority
        className="size-[24px] max-xl:size-14"
      />
      <Nav
        isCollapsed={isMobile ? true : isCollapsed}
        links={filteredLinks} // Pass filtered links to Nav
      />
    </div>
  );
}
