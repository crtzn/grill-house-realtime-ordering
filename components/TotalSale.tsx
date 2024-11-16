"use client";

import React from "react";
import { CardContent } from "@/components/TotalCustomerBox";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart as BarGraph,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
} from "recharts";

type Props = {};

const data = [
  { month: "Jan", sales: 20000 },
  { month: "Feb", sales: 15000 },
  { month: "Mar", sales: 12000 },
  { month: "Apr", sales: 18000 },
  { month: "May", sales: 32000 },
  { month: "Jun", sales: 23000 },
  { month: "Jul", sales: 21000 },
  { month: "Aug", sales: 18000 },
  { month: "Sep", sales: 10000 },
  { month: "Oct", sales: 12030 },
  { month: "Nov", sales: 43000 },
  { month: "Dec", sales: 12000 },
];

export default function CustomerChart({}: Props) {
  const RecentYear = new Date().getFullYear();
  return (
    <CardContent>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Total Sales</CardTitle>
        <CardDescription>January - December {RecentYear}</CardDescription>
      </CardHeader>
      <ResponsiveContainer width="100%" height={300}>
        <BarGraph data={data}>
          <XAxis dataKey="month" tickLine={false} axisLine={true} />
          <Bar dataKey="sales" fill="#11111" />
          <Tooltip cursor={true} />
        </BarGraph>
      </ResponsiveContainer>
    </CardContent>
  );
}
