"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import supabase from "@/lib/supabaseClient";

export function CustomerChart() {
  const [chartData, setChartData] = useState<
    Array<{ month: string; count: number }>
  >([]);

  useEffect(() => {
    async function fetchCustomerData() {
      const { data, error } = await supabase
        .from("orders")
        .select("created_at, customer_count")
        .order("created_at");

      if (error) {
        console.error("Error fetching customer data:", error);
        return;
      }

      const monthlyData = data.reduce((acc, order) => {
        const month = new Date(order.created_at).toLocaleString("default", {
          month: "short",
        });
        acc[month] = (acc[month] || 0) + (order.customer_count || 0);
        return acc;
      }, {} as Record<string, number>);

      const formattedData = Object.entries(monthlyData)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => {
          const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          return months.indexOf(a.month) - months.indexOf(b.month);
        });

      setChartData(formattedData);
    }

    fetchCustomerData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customers per Month</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
