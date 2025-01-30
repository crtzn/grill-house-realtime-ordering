// utils/filterLinks.ts
import { Nav } from "@/components/nav"; // Adjust the import path as needed
import {
  LayoutDashboard,
  ListOrdered,
  LucideIcon,
  SquareMenu,
  TabletSmartphone,
} from "lucide-react";

interface NavLink {
  title: string;
  label?: string;
  icon: LucideIcon;
  variant: "default" | "ghost";
  href: string;
}

export const filterLinks = (role: string | null): NavLink[] => {
  const allLinks = [
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
  ];

  switch (role) {
    case "admin":
      return allLinks; // Admin can access all links
    case "kitchen":
      return allLinks.filter((link) => link.href === "/admin/order"); // Kitchen can only access /admin/order
    case "staff":
      return allLinks.filter(
        (link) => link.href === "/admin/menu" || link.href === "/admin/device"
      ); // Staff can access /admin/menu and /admin/device
    default:
      return []; // No access for unauthenticated users
  }
};
