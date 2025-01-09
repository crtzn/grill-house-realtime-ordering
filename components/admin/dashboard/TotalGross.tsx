"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import supabase from "@/lib/supabaseClient";

interface IncomeData {
  totalGross: number;
  monthlyIncome: { [key: string]: number };
  yesterdayIncome: number;
  todayIncome: number;
}

interface OrderData {
  id: string;
  customer_count: number;
  created_at: string;
  packages: {
    price: number;
  };
}

export function TotalGross() {
  const [incomeData, setIncomeData] = useState<IncomeData>({
    totalGross: 0,
    monthlyIncome: {},
    yesterdayIncome: 0,
    todayIncome: 0,
  });

  useEffect(() => {
    async function fetchIncomeData() {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          customer_count,
          created_at,
          packages (
            price
          )
        `
        )
        .gte("created_at", new Date(today.getFullYear(), 0, 1).toISOString());

      if (error) {
        console.error("Error fetching data:", error);
        return;
      }

      let totalGross = 0;
      let monthlyIncome: { [key: string]: number } = {};
      let yesterdayIncome = 0;
      let todayIncome = 0;

      (data as unknown as OrderData[]).forEach((order) => {
        const orderDate = new Date(order.created_at);
        const orderTotal = order.packages.price * order.customer_count;

        totalGross += orderTotal;

        const monthKey = `${orderDate.getFullYear()}-${(
          orderDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;
        monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + orderTotal;

        if (orderDate.toDateString() === today.toDateString()) {
          todayIncome += orderTotal;
        } else if (orderDate.toDateString() === yesterday.toDateString()) {
          yesterdayIncome += orderTotal;
        }
      });

      setIncomeData({
        totalGross,
        monthlyIncome,
        yesterdayIncome,
        todayIncome,
      });
    }

    fetchIncomeData();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  const incomeChange = incomeData.todayIncome - incomeData.yesterdayIncome;
  const incomeChangePercentage =
    incomeData.yesterdayIncome !== 0
      ? (incomeChange / incomeData.yesterdayIncome) * 100
      : 0;

  const getMonthName = (monthNum: string) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[parseInt(monthNum) - 1];
  };

  const chartData = Object.entries(incomeData.monthlyIncome)
    .map(([month, income]) => ({
      month: month.split("-")[1],
      monthName: getMonthName(month.split("-")[1]),
      income: income,
    }))
    .sort((a, b) => parseInt(a.month) - parseInt(b.month));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Income Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Total Gross Income
            </h3>
            <p className="text-3xl font-bold text-blue-900">
              {formatCurrency(incomeData.totalGross)}
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Today's Income
            </h3>
            <p className="text-3xl font-bold text-green-900">
              {formatCurrency(incomeData.todayIncome)}
            </p>
            {/* <div className="flex items-center mt-2">
              {incomeChange >= 0 ? (
                <ArrowUpIcon className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-red-600 mr-1" />
              )}
              <p
                className={`text-sm font-medium ${
                  incomeChange >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(incomeChange))} (
                {incomeChangePercentage.toFixed(2)}%)
                <span className="text-gray-600"> vs Yesterday</span>
              </p>
            </div> */}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">
            Monthly Revenue Breakdown
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                barSize={30}
                maxBarSize={40}
                margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
              >
                <XAxis
                  dataKey="monthName"
                  tick={{ fill: "#6B7280" }}
                  tickLine={{ stroke: "#E5E7EB" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("en-US", {
                      notation: "compact",
                      compactDisplay: "short",
                      currency: "PHP",
                    }).format(value)
                  }
                  tick={{ fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={{ stroke: "#E5E7EB" }}
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(value as number),
                    "Income",
                  ]}
                  labelFormatter={(label) => label}
                  cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                />
                <Bar dataKey="income" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TotalGross;
