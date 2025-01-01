"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ListOrdered,
  SquareMenu,
  TabletSmartphone,
  Bell,
} from "lucide-react";
import { Nav } from "@/components/nav";
import Image from "next/image";
import { useWindowWidth } from "@react-hook/window-size";
import { set } from "react-hook-form";

export default function SideNavbar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mobileWidth = useWindowWidth();

  useEffect(() => {
    setIsMobile(mobileWidth < 768);
  });

  return (
    <div className="flex flex-col items-center relative min-w-[80px] border-r px-3  pb-5 pt-10 ">
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
            href: "/admin/device",
          },
        ]}
      />
    </div>
  );
}
