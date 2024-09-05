"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  ListOrdered,
  SquareMenu,
  TabletSmartphone,
  Bell,
} from "lucide-react";
import { Nav } from "@/components/nav";
// import { useWindowWidth } from "@react-hook/window-size";

export default function SideNavbar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  //   const onlyWidth = useWindowWidth();
  //   const mobileWidth = onlyWidth < 768;
  return (
    <div className="relative min-w-[80px] border-r px-3  pb-5 pt-10">
      <Nav
        isCollapsed={false}
        links={[
          {
            title: "DASHBOARD",
            label: "",
            icon: LayoutDashboard,
            variant: "ghost",
            href: "/dashboard",
          },
          {
            title: "ORDER",
            label: "",
            icon: ListOrdered,
            variant: "ghost",
            href: "/order",
          },
          {
            title: "MENU",
            label: "",
            icon: SquareMenu,
            variant: "ghost",
            href: "/menu",
          },
          {
            title: "DEVICES",
            label: "",
            icon: TabletSmartphone,
            variant: "ghost",
            href: "/device",
          },
        ]}
      />
    </div>
  );
}
