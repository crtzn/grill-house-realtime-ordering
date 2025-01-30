import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import supabase from "@/lib/supabaseClient";

interface IncomeData {
  totalGross: number;
  monthlyIncome: { [key: string]: number };
  todayIncome: number;
}

interface OrderWithPackage {
  id: string;
  customer_count: number;
  payment_status: string;
  created_at: string;
  terminated_at: string | null;
  packages: any;
}

export function TotalGross() {
  const [incomeData, setIncomeData] = useState<IncomeData>({
    totalGross: 0,
    monthlyIncome: {},
    todayIncome: 0,
  });
  const [timeRange, setTimeRange] = useState("year");

  useEffect(() => {
    fetchIncomeData();

    const ordersChannel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchIncomeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [timeRange]);

  const fetchIncomeData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date();
    switch (timeRange) {
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case "all":
        startDate = new Date(2000, 0, 1); // Far past date to get all records
        break;
    }

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        customer_count,
        payment_status,
        created_at,
        terminated_at,
        packages (
          price
        )
      `
      )
      .eq("payment_status", "paid")
      .gte("created_at", startDate.toISOString());

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    let totalGross = 0;
    let monthlyIncome: { [key: string]: number } = {};
    let todayIncome = 0;

    (ordersData as OrderWithPackage[]).forEach((order) => {
      const orderDate = new Date(order.terminated_at || order.created_at);
      const orderTotal = order.customer_count * (order.packages.price || 0);

      // Calculate total gross
      totalGross += orderTotal;

      // Calculate monthly income
      const monthKey = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + orderTotal;

      // Calculate today's income
      if (orderDate.toDateString() === today.toDateString()) {
        todayIncome += orderTotal;
      }
    });

    setIncomeData({
      totalGross,
      monthlyIncome,
      todayIncome,
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

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
    <Card className="w-full m-h-screen shadow-md hover:shadow-xl transition-all duration-300 border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Income Overview</CardTitle>
        {/* <Select
          value={timeRange}
          onValueChange={(value) => setTimeRange(value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select> */}
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
          </div>
        </div>

        <div className="mt-8">
          <div className="space-y-4">
            {chartData.map((data) => (
              <div key={data.month} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{data.monthName}</span>
                  <span className="text-blue-600 font-semibold">
                    {formatCurrency(data.income)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        (data.income /
                          Math.max(...chartData.map((d) => d.income))) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TotalGross;
