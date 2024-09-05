import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";
import Link from "next/link";

// so eto yung eexport mo, reuable component. Called mo lang yung CardProps sa ibang component. Then lagay mo lang mga needed props.
export type CardProps = {
  amount: number;
  description: string;
};

// instead doing this -> function Card({ label, icon, amount, description }: CardProps) use this ...
export default function Card(props: CardProps) {
  return (
    <CardContent>
      <section className="flex flex-col gap-1">
        {/* Amount */}
        <h2 className="text-2xl font-semibold">{props.amount}</h2>
        {/* Description */}
        <p className="text-xs text-gray-500">{props.description}</p>
      </section>
    </CardContent>
  );
}

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
