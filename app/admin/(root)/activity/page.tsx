"use client";

import React, { useState, useEffect } from "react";
import supabase from "@/lib/supabaseClient";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Eye } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";

export interface Package {
  id: string;
  name: string;
  price: number;
}

export default function ActivityLog() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTables, setSelectedTables] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Calculate pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  useEffect(() => {
    fetchTables();
    fetchPackages();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [
    selectedTables,
    selectedStatus,
    timeFilter,
    searchQuery,
    date,
    selectedPackage,
  ]);

  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    if (value !== "custom") {
      setDate(undefined);
    }
  };

  async function fetchOrders() {
    let query = supabase
      .from("orders")
      .select(
        `*,
        package:package_id(*),
        table:table_id(table_number),
        order_addons:order_addons(
          quantity,
          add_on:add_ons(
            name,
            price
          )
        )`
      )
      .order("created_at", { ascending: false });

    if (selectedTables !== "all") query = query.eq("table_id", selectedTables);
    if (selectedStatus !== "all") query = query.eq("status", selectedStatus);
    if (selectedPackage !== "all")
      query = query.eq("package_id", selectedPackage);

    const now = new Date();
    if (timeFilter === "today") {
      query = query
        .gte("created_at", startOfDay(now).toISOString())
        .lte("created_at", endOfDay(now).toISOString());
    } else if (timeFilter === "week") {
      query = query
        .gte("created_at", startOfWeek(now).toISOString())
        .lte("created_at", endOfWeek(now).toISOString());
    } else if (timeFilter === "month") {
      query = query
        .gte("created_at", startOfMonth(now).toISOString())
        .lte("created_at", endOfMonth(now).toISOString());
    } else if (timeFilter === "custom" && date) {
      query = query
        .gte("created_at", startOfDay(date).toISOString())
        .lte("created_at", endOfDay(date).toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      let filteredData = data || [];
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (order) =>
            order.id?.toString().toLowerCase().includes(query) ||
            order.table?.table_number
              ?.toString()
              .toLowerCase()
              .includes(query) ||
            order.package?.name?.toLowerCase().includes(query) ||
            order.status?.toLowerCase().includes(query)
        );
      }
      setOrders(filteredData);
    }
    setLoading(false);
  }

  async function fetchTables() {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .order("table_number", { ascending: true });

    if (error) console.error("Error Fetching Tables:", error);
    else setTables(data);
  }

  async function fetchPackages() {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("name", { ascending: true });

    if (error) console.error("Error Fetching Packages:", error);
    else setPackages(data);
  }

  const calculateTotal = (order: any) => {
    // Calculate package total (package price * customer count)
    const packageTotal =
      (order.package?.price || 0) * (order.customer_count || 1);

    // Calculate addons total
    const addonsTotal =
      order.order_addons?.reduce((sum: number, addon: any) => {
        return sum + (addon.quantity || 0) * (addon.add_on?.price || 0);
      }, 0) || 0;

    // Return the sum of package total and addons total
    return packageTotal + addonsTotal;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search activities..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={selectedTables} onValueChange={setSelectedTables}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Tables" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Tables</SelectItem>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    Table {table.table_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Package Filter" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Packages</SelectItem>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Time Filter" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Date</SelectItem>
              </SelectContent>
            </Select>

            {timeFilter === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="px-4 py-2 border rounded-lg bg-white">
                    {date ? format(date, "PPP") : "Pick a date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Order Id
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Add-ons
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Customer Count
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{order.id}</td>
                      <td className="px-6 py-4 text-sm">
                        Table {order.table?.table_number}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.package?.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.order_addons
                          ?.map(
                            (addon: any) =>
                              `${addon.add_on?.name} (${addon.quantity})`
                          )
                          .join(", ") || "None"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.customer_count || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        ₱{calculateTotal(order).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            order.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {format(
                          new Date(order.created_at),
                          "MMM d, yyyy h:mm a"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-white p-4 border-t">
            <p className="text-sm text-gray-500">
              Showing {indexOfFirstOrder + 1}-
              {Math.min(indexOfLastOrder, orders.length)} of {orders.length}{" "}
              orders
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`px-4 py-2 border rounded-lg ${
                      currentPage === page ? "bg-blue-600 text-white" : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
