"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import supabase from "@/lib/supabaseClient";

interface Package {
  id: number;
  name: string;
  price: number;
}

interface AddOn {
  id: number;
  name: string;
  price: number;
}

interface OrderAddon {
  id: number;
  order_id: number;
  add_on_id: number;
  quantity: number;
  status: string;
  add_on: AddOn;
}

interface Order {
  id: number;
  table_id: number;
  package_id: number;
  customer_count: number;
  payment_status: string;
  status: string;
  created_at: string;
  package: Package;
  order_addons: OrderAddon[];
  table: {
    table_number: number;
  };
}

export default function ActivityLog() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

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

  const getDateFilter = () => {
    const now = new Date();
    switch (dateFilter) {
      case "today": {
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        ).toISOString();
        return startOfDay;
      }
      case "current-month": {
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).toISOString();
        return startOfMonth;
      }
      case "current-year": {
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
        return startOfYear;
      }
      case "specific-year": {
        const startOfYear = new Date(selectedYear, 0, 1).toISOString();
        const endOfYear = new Date(selectedYear + 1, 0, 1).toISOString();
        return { start: startOfYear, end: endOfYear };
      }
      case "specific-month": {
        if (selectedMonth !== null && selectedYear) {
          const startOfMonth = new Date(
            selectedYear,
            selectedMonth,
            1
          ).toISOString();
          const endOfMonth = new Date(
            selectedYear,
            selectedMonth + 1,
            0
          ).toISOString();
          return { start: startOfMonth, end: endOfMonth };
        }
        return null;
      }
      default:
        return null;
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === "INSERT") {
      // Fetch the new order with all its relations
      fetchSingleOrder(payload.new.id).then((newOrder) => {
        if (newOrder) {
          setOrders((currentOrders) => [newOrder, ...currentOrders]);
        }
      });
    } else if (payload.eventType === "UPDATE") {
      fetchSingleOrder(payload.new.id).then((updatedOrder) => {
        if (updatedOrder) {
          setOrders((currentOrders) =>
            currentOrders.map((order) =>
              order.id === updatedOrder.id ? updatedOrder : order
            )
          );
        }
      });
    } else if (payload.eventType === "DELETE") {
      setOrders((currentOrders) =>
        currentOrders.filter((order) => order.id !== payload.old.id)
      );
    }
  };

  async function fetchSingleOrder(orderId: number) {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        package:packages(*),
        table:tables(table_number),
        order_addons:order_addons(
          *,
          add_on:add_ons(*)
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Error fetching single order:", error);
      return null;
    }
    return data;
  }

  async function fetchOrders() {
    let query = supabase
      .from("orders")
      .select(
        `
        *,
        package:packages(*),
        table:tables(table_number),
        order_addons:order_addons(
          *,
          add_on:add_ons(*)
        )
      `
      )
      .order("created_at", { ascending: false });

    const dateFilterValue = getDateFilter();

    if (dateFilterValue) {
      if (typeof dateFilterValue === "string") {
        query = query.gte("created_at", dateFilterValue);
      } else if (dateFilterValue.start && dateFilterValue.end) {
        query = query
          .gte("created_at", dateFilterValue.start)
          .lt("created_at", dateFilterValue.end);
      }
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data || []);
    }
  }

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateFilter, selectedYear, selectedMonth]);

  const calculateTotal = (order: Order) => {
    const packageTotal = order.package.price * order.customer_count;
    const addonsTotal = order.order_addons.reduce((sum, addon) => {
      return sum + addon.add_on.price * addon.quantity;
    }, 0);
    return packageTotal + addonsTotal;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Activity Log</CardTitle>
          <div className="flex gap-2">
            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value);
                if (value !== "specific-year" && value !== "specific-month") {
                  setSelectedYear(new Date().getFullYear());
                  setSelectedMonth(null);
                }
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="current-year">Current Year</SelectItem>
                <SelectItem value="specific-year">Specific Year</SelectItem>
                <SelectItem value="specific-month">Specific Month</SelectItem>
              </SelectContent>
            </Select>

            {dateFilter === "specific-year" && (
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {dateFilter === "specific-month" && (
              <>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedMonth?.toString() ?? ""}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="outline-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Customers</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Add-ons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>Table {order.table.table_number}</TableCell>
                <TableCell>{order.package.name}</TableCell>
                <TableCell>{order.customer_count}</TableCell>
                <TableCell>₱{calculateTotal(order).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      order.payment_status === "paid" ? "default" : "secondary"
                    }
                  >
                    {order.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle>Order Add-ons</DialogTitle>
                      </DialogHeader>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.order_addons.map((addon) => (
                            <TableRow key={addon.id}>
                              <TableCell>{addon.add_on.name}</TableCell>
                              <TableCell>{addon.quantity}</TableCell>
                              <TableCell>₱{addon.add_on.price}</TableCell>
                              <TableCell>
                                ₱
                                {(
                                  addon.quantity * addon.add_on.price
                                ).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="mt-4 flex justify-between items-center px-4">
                        <div>
                          <Badge variant="outline">
                            Package: {order.package.name}
                          </Badge>
                          <Badge variant="outline" className="ml-2">
                            Customers: {order.customer_count}
                          </Badge>
                        </div>
                        <div className="text-lg font-semibold">
                          Total: ₱{calculateTotal(order).toLocaleString()}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
