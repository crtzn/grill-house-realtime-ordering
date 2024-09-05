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
  { month: "Jan", customers: 10 },
  { month: "Feb", customers: 15 },
  { month: "Mar", customers: 8 },
  { month: "Apr", customers: 12 },
  { month: "May", customers: 20 },
  { month: "Jun", customers: 18 },
  { month: "Jul", customers: 14 },
  { month: "Aug", customers: 16 },
  { month: "Sep", customers: 10 },
  { month: "Oct", customers: 12 },
  { month: "Nov", customers: 15 },
  { month: "Dec", customers: 18 },
];

export default function CustomerChart({}: Props) {
  return (
    <CardContent>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Customer</CardTitle>
        <CardDescription>January - December 2024</CardDescription>
      </CardHeader>
      <ResponsiveContainer width="100%" height={300}>
        <BarGraph data={data}>
          <XAxis dataKey="month" tickLine={false} axisLine={true} />
          <Bar dataKey="customers" fill="#11111" />
          <Tooltip cursor={true} />
        </BarGraph>
      </ResponsiveContainer>
    </CardContent>
  );
}
