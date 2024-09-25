"use client";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface GalleryProps {
  name: string;
  description: string;
  quantity: number;
  onAddToOrder: () => void;
}

function Gallery({ name, description, onAddToOrder }: GalleryProps) {
  const [menuName, setMenuName] = useState("");

  return (
    <div onClick={onAddToOrder}>
      <Card>
        <CardContent>
          <img
            src="https://placehold.co/600x400"
            alt="menu"
            width={600}
            height={400}
            className="rounded-xl"
          />
          <CardTitle>{name}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

export default Gallery;

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border p-5 shadow",
        props.className
      )}
    />
  );
}
