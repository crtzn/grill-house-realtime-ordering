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
import { getUserRole } from "@/app/utils/getUserRoles";
import { filterLinks } from "@/app/utils/filterLink";

export default function SideNavbar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const mobileWidth = useWindowWidth();

  useEffect(() => {
    setIsMobile(mobileWidth < 768);
    const role = getUserRole();
    setUserRole(role);
  }, [mobileWidth]);

  const filteredLinks = filterLinks(userRole);

  return (
    <div className="flex flex-col items-center relative min-w-[80px] border-r px-3 pb-5 pt-10">
      <div className="mb-4 w-full flex justify-center">
        <Image
          src="/assets/Logo.png"
          width={80}
          height={80}
          alt="Logo"
          priority
          className="w-16 h-16 md:w-20 md:h-20"
        />
      </div>
      <Nav isCollapsed={isMobile ? true : isCollapsed} links={filteredLinks} />
    </div>
  );
}
