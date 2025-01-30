import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import supabase from "@/lib/supabaseClient";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-md p-2 rounded-md border border-gray-200">
        <p className="font-bold">{payload[0].payload.month}</p>
        <p className="text-primary">{payload[0].value} Customers</p>
      </div>
    );
  }
  return null;
};

const CustomerChart: React.FC = () => {
  const [chartData, setChartData] = useState<
    { month: string; count: number }[]
  >([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  const chartConfig: ChartConfig = {
    count: {
      label: "Customers",
      color: "hsl(var(--primary))",
    },
  };

  const fetchCustomerData = async (year: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("created_at, customer_count")
        .gte("created_at", `${year}-01-01`)
        .lt("created_at", `${year + 1}-01-01`)
        .order("created_at");

      if (error) throw error;

      const monthlyData = data.reduce((acc, order) => {
        const month = new Date(order.created_at).toLocaleString("default", {
          month: "short",
        });
        acc[month] = (acc[month] || 0) + (order.customer_count || 0);
        return acc;
      }, {} as Record<string, number>);

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

      const formattedData = months.map((month) => ({
        month,
        count: monthlyData[month] || 0,
      }));

      setChartData(formattedData);
    } catch (error) {
      console.error("Error fetching customer data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData(currentYear);
  }, [currentYear]);

  const handleYearChange = (direction: "prev" | "next") => {
    setCurrentYear((prev) => (direction === "prev" ? prev - 1 : prev + 1));
  };

  return (
    <Card className="w-full shadow-lg border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">
          Customer Chart - {currentYear}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleYearChange("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleYearChange("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <p>Loading chart data...</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[400px] w-[40rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={30} barGap={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  className="text-sm"
                />
                <YAxis
                  domain={[0, "dataMax + 10"]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar
                  dataKey="count"
                  fill="var(--color-desktop)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerChart;
