"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import supabase from "@/lib/supabaseClient";
import NewOrderDialog from "@/components/admin/order/newOrderDialog";

interface MenuItem {
  name: string;
  category: string;
}

interface Table {
  table_number: number;
}

interface Package {
  name: string;
}

interface Order {
  table: Table;
  package: Package;
  customer_count: number;
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  menu_item: MenuItem;
  quantity: number;
  status: "pending" | "preparing" | "served";
  order: Order;
}

export default function OrderManagement() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchOrderItems();

    const orderItemsChannel = supabase
      .channel("order_items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => fetchOrderItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderItemsChannel);
    };
  }, []);

  const fetchOrderItems = async () => {
    const { data, error } = await supabase
      .from("order_items")
      .select(
        `
        id,
        order_id,
        quantity,
        status,
        menu_item:menu_items (name, category),
        order:orders (
          table:tables (table_number),
          package:packages (name),
          customer_count,
          created_at
        )
      `
      )
      .in("status", ["pending", "preparing"])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching order items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } else {
      // Transform the data to match the interface
      const transformedData: OrderItem[] = (data || []).map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        quantity: item.quantity,
        status: item.status,
        menu_item: {
          name: item.menu_item?.[0]?.name || "",
          category: item.menu_item?.[0]?.category || "",
        },
        order: {
          table: {
            table_number: item.order?.[0]?.table?.[0]?.table_number || 0,
          },
          package: {
            name: item.order?.[0]?.package?.[0]?.name || "",
          },
          customer_count: item.order?.[0]?.customer_count || 0,
          created_at: item.order?.[0]?.created_at || "",
        },
      }));
      setOrderItems(transformedData);
    }
  };

  // Rest of your component remains the same...
  const updateOrderItemStatus = async (
    orderItemId: string,
    newStatus: "preparing" | "served"
  ) => {
    const { error } = await supabase
      .from("order_items")
      .update({ status: newStatus })
      .eq("id", orderItemId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to update order status to ${newStatus}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
      fetchOrderItems();
    }
  };

  // Group order items by table
  const ordersByTable = orderItems.reduce(
    (acc, item) => {
      const tableNumber = item.order.table.table_number;
      if (!acc[tableNumber]) {
        acc[tableNumber] = {
          tableNumber,
          packageName: item.order.package.name,
          customerCount: item.order.customer_count,
          createdAt: item.order.created_at,
          items: [],
        };
      }
      acc[tableNumber].items.push(item);
      return acc;
    },
    {} as Record<
      number,
      {
        tableNumber: number;
        packageName: string;
        customerCount: number;
        createdAt: string;
        items: OrderItem[];
      }
    >
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Active Orders</h1>
        <NewOrderDialog onOrderCreated={fetchOrderItems} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(ordersByTable).map((tableData) => (
          <Card key={tableData.tableNumber} className="shadow-lg">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex justify-between">
                <span>Table {tableData.tableNumber}</span>
                <span className="text-sm text-gray-500">
                  {tableData.packageName}
                </span>
              </CardTitle>
              <div className="text-sm text-gray-600">
                Customers: {tableData.customerCount}
              </div>
              <div className="text-xs text-gray-500">
                Created: {new Date(tableData.createdAt).toLocaleString()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tableData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.menu_item.name} × {item.quantity}
                      </div>
                      <div className="text-sm text-gray-500">
                        Status: {item.status}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          updateOrderItemStatus(item.id, "preparing")
                        }
                        className="bg-yellow-500 hover:bg-yellow-600"
                        disabled={item.status !== "pending"}
                        size="sm"
                      >
                        Prepare
                      </Button>
                      <Button
                        onClick={() => updateOrderItemStatus(item.id, "served")}
                        className="bg-green-500 hover:bg-green-600"
                        disabled={item.status !== "preparing"}
                        size="sm"
                      >
                        Serve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
