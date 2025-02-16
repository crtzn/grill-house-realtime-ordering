"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ListOrdered,
  SquareMenu,
  TabletSmartphone,
  Bell,
  LogOut,
  ScrollText,
  Settings,
} from "lucide-react";
import { Nav } from "@/components/nav";
import Image from "next/image";
import { useWindowWidth } from "@react-hook/window-size";
import { set } from "react-hook-form";
import { handleLogOut } from "@/app/utils/logOut";
import { cn } from "@/lib/utils";

export default function SideNavbar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mobileWidth = useWindowWidth();

  useEffect(() => {
    setIsMobile(mobileWidth < 768);
  });

  return (
    <div className="flex bg-[#ffffff] flex-col items-center relative min-w-[10rem] px-7  pb-5 pt-10 ">
      <Image
        src="/assets/Logo.png"
        width={80}
        height={80}
        alt="Logo"
        priority
        className="size-[24px max-xl:size-14"
      />
      <Nav
        isCollapsed={isMobile ? true : isCollapsed}
        links={[
          {
            title: "DASHBOARD",
            label: "",
            icon: LayoutDashboard,
            variant: "default",
            href: "/admin",
          },
          {
            title: "ORDER",
            label: "",
            icon: ListOrdered,
            variant: "default",
            href: "/admin/order",
          },
          {
            title: "MENU",
            label: "",
            icon: SquareMenu,
            variant: "default",
            href: "/admin/menu",
          },
          {
            title: "TABLE",
            label: "",
            icon: TabletSmartphone,
            variant: "default",
            href: "/admin/table",
          },
          {
            title: "ACTIVITY",
            label: "",
            icon: ScrollText,
            variant: "default",
            href: "/admin/activity",
          },
          {
            title: "SETTING",
            label: "",
            icon: Settings,
            variant: "default",
            href: "/admin/setting",
          },
        ]}
      />

      <button
        onClick={handleLogOut}
        className={cn(
          "flex items-center justify-center w-full mt-4 p-2 rounded-lg",
          "bg-red-500 text-white hover:bg-red-600 transition-colors"
        )}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {!isMobile && "Logout"}
      </button>
    </div>
  );
}
