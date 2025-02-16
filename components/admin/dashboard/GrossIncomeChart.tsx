import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  addDays,
} from "date-fns";
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
import { handleDownloadPDF } from "@/app/utils/salesReportGenerator";
import { DateRange } from "react-day-picker"; // Import DateRange from react-day-picker

interface Package {
  price: number;
}

interface AddOn {
  price: number;
}

interface OrderAddon {
  quantity: number;
  add_ons: AddOn;
}

interface OrderWithPackage {
  id: string;
  customer_count: number;
  payment_status: string;
  created_at: string;
  terminated_at: string | null;
  packages: Package;
  order_addons: OrderAddon[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const amount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(payload[0].value);

    return (
      <div className="bg-white shadow-md p-2 rounded-md border border-gray-200">
        <p className="font-bold">{payload[0].payload.label}</p>
        <p className="text-primary">{amount}</p>
      </div>
    );
  }
  return null;
};

const GrossIncomeChart: React.FC = () => {
  const [chartData, setChartData] = useState<
    { label: string; income: number }[]
  >([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isCustomRange, setIsCustomRange] = useState(false);

  const chartConfig: ChartConfig = {
    income: {
      label: "Gross Income",
      color: "hsl(var(--primary))",
    },
  };

  const calculateOrderTotal = (order: OrderWithPackage): number => {
    const packageTotal = order.customer_count * (order.packages?.price || 0);
    const addonsTotal =
      order.order_addons?.reduce(
        (sum, addon) => sum + addon.quantity * (addon.add_ons?.price || 0),
        0
      ) || 0;
    return packageTotal + addonsTotal;
  };

  const aggregateData = (
    ordersData: OrderWithPackage[],
    range: typeof timeRange
  ): Map<string, number> => {
    const incomeMap = new Map<string, number>();

    ordersData.forEach((order) => {
      const orderDate = new Date(order.terminated_at || order.created_at);
      let key = "";

      switch (range) {
        case "daily":
          key = format(orderDate, "HH:00");
          break;
        case "weekly":
          key = format(orderDate, "EEE");
          break;
        case "monthly":
          key = format(orderDate, "d");
          break;
        case "yearly":
          key = format(orderDate, "MMM");
          break;
      }

      const orderTotal = calculateOrderTotal(order);
      incomeMap.set(key, (incomeMap.get(key) || 0) + orderTotal);
    });

    return incomeMap;
  };

  const formatChartData = (
    incomeMap: Map<string, number>,
    range: typeof timeRange
  ) => {
    switch (range) {
      case "daily":
        return Array.from({ length: 24 }, (_, hour) => ({
          label: `${hour.toString().padStart(2, "0")}:00`,
          income: incomeMap.get(`${hour.toString().padStart(2, "0")}:00`) || 0,
        }));

      case "weekly":
        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return weekDays.map((day) => ({
          label: day,
          income: incomeMap.get(day) || 0,
        }));

      case "monthly":
        const daysInMonth = new Date(currentYear, selectedMonth, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => ({
          label: `${i + 1}`,
          income: incomeMap.get(`${i + 1}`) || 0,
        }));

      case "yearly":
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
        return months.map((month) => ({
          label: month,
          income: incomeMap.get(month) || 0,
        }));
    }
  };

  const fetchIncomeData = async () => {
    setIsLoading(true);
    try {
      let startDate: Date, endDate: Date;

      if (isCustomRange && dateRange.from && dateRange.to) {
        // For custom date range
        startDate = startOfDay(dateRange.from);
        endDate = endOfDay(dateRange.to);
      } else {
        switch (timeRange) {
          case "daily":
            startDate = startOfDay(selectedDate);
            endDate = endOfDay(selectedDate);
            break;
          case "weekly":
            const weekStart = new Date(selectedDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            startDate = startOfDay(weekStart);
            endDate = endOfDay(addDays(weekStart, 6));
            break;
          case "monthly":
            startDate = startOfMonth(new Date(currentYear, selectedMonth - 1));
            endDate = endOfMonth(new Date(currentYear, selectedMonth - 1));
            break;
          case "yearly":
            startDate = new Date(currentYear, 0, 1);
            endDate = new Date(currentYear, 11, 31, 23, 59, 59);
            break;
        }
      }

      console.log("Fetching data for date range:", { startDate, endDate });

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
          ),
          order_addons (
            quantity,
            add_ons (
              price
            )
          )
        `
        )
        .eq("payment_status", "paid")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at");

      if (error) throw error;

      console.log("Orders data fetched:", ordersData);

      const incomeMap = aggregateData(
        ordersData as unknown as OrderWithPackage[],
        timeRange
      );
      const formattedData = formatChartData(incomeMap, timeRange);
      setChartData(formattedData || []);
    } catch (error) {
      console.error("Error fetching income data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isCustomRange && dateRange.from && dateRange.to) {
      fetchIncomeData();
    }
  }, [dateRange, isCustomRange]);
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
  }, [timeRange, selectedDate, selectedMonth, currentYear]);

  const handleDateChange = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    switch (timeRange) {
      case "daily":
        newDate.setDate(newDate.getDate() + (direction === "prev" ? -1 : 1));
        setSelectedDate(newDate);
        break;
      case "weekly":
        newDate.setDate(newDate.getDate() + (direction === "prev" ? -7 : 7));
        setSelectedDate(newDate);
        break;
      case "monthly":
        const newMonth =
          direction === "prev" ? selectedMonth - 1 : selectedMonth + 1;
        if (newMonth < 1) {
          setSelectedMonth(12);
          setCurrentYear(currentYear - 1);
        } else if (newMonth > 12) {
          setSelectedMonth(1);
          setCurrentYear(currentYear + 1);
        } else {
          setSelectedMonth(newMonth);
        }
        break;
      case "yearly":
        setCurrentYear(currentYear + (direction === "prev" ? -1 : 1));
        break;
    }
    setCurrentDate(newDate);
  };

  const handleDownloadReport = () => {
    if (isCustomRange && dateRange.from && dateRange.to) {
      handleDownloadPDF(
        undefined,
        undefined,
        undefined,
        dateRange.from,
        dateRange.to
      );
    } else if (timeRange === "daily") {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      handleDownloadPDF(year, month, day);
    } else if (timeRange === "monthly") {
      handleDownloadPDF(currentYear, selectedMonth);
    } else {
      handleDownloadPDF(currentYear);
    }
  };

  const getDateRangeText = () => {
    if (isCustomRange && dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "MMM d, yyyy")} - ${format(
        dateRange.to,
        "MMM d, yyyy"
      )}`;
    }

    switch (timeRange) {
      case "daily":
        return format(selectedDate, "MMMM d, yyyy");
      case "weekly":
        const weekStart = new Date(selectedDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, "MMM d")} - ${format(
          weekEnd,
          "MMM d, yyyy"
        )}`;
      case "monthly":
        return format(new Date(currentYear, selectedMonth - 1), "MMMM yyyy");
      case "yearly":
        return `${currentYear}`;
    }
  };

  return (
    <Card className="w-full shadow-lg border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold">
            Gross Income Chart - {getDateRangeText()}
          </CardTitle>
          <div className="flex justify-evenly items-center align-middle mt-2">
            <div className="">
              <Select
                value={isCustomRange ? "custom" : timeRange}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setIsCustomRange(true);
                  } else {
                    setIsCustomRange(false);
                    setTimeRange(
                      value as "daily" | "weekly" | "monthly" | "yearly"
                    );
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="custom">Custom Range</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              {isCustomRange ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Pick a date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range: DateRange | undefined) => {
                        if (range) {
                          setDateRange({ from: range.from, to: range.to });
                        } else {
                          setDateRange({ from: undefined, to: undefined });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              ) : timeRange === "daily" ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      {format(selectedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date: Date | undefined) =>
                        date && setSelectedDate(date)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : timeRange === "monthly" ? (
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {format(new Date(2024, i, 1), "MMMM")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleDownloadReport}
            className="bg-black text-white"
          >
            Download PDF
          </Button>
          {!isCustomRange && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
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
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  className="text-sm"
                  interval={timeRange === "daily" ? 2 : 0}
                  angle={timeRange === "daily" ? -45 : 0}
                  textAnchor={timeRange === "daily" ? "end" : "middle"}
                  height={timeRange === "daily" ? 80 : 30}
                />
                <YAxis
                  domain={[0, "dataMax + 1000"]}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PHP",
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar
                  dataKey="income"
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

export default GrossIncomeChart;
