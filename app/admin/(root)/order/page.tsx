"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import supabase from "@/lib/supabaseClient";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "@/components/ui/use-toast";

interface OrderItem {
  id: string;
  menu_item: {
    name: string;
    category: string;
  };
  quantity: number;
  status: "pending" | "preparing" | "served" | "cancelled";
}

interface Order {
  id: string;
  table: {
    id: string;
    table_number: number;
  };
  package: {
    name: string;
  };
  customer_count: number;
  status: "pending" | "active" | "completed" | "cancelled";
  created_at: string;
  order_items: OrderItem[];
}

interface Table {
  id: string;
  table_number: number;
  status: "available" | "occupied" | "inactive";
  capacity: number;
}

interface Package {
  id: string;
  name: string;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [newCustomer, setNewCustomer] = useState({
    table_id: "",
    package_id: "",
    customer_count: "",
  });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    fetchOrders();
    fetchTables();
    fetchPackages();

    const ordersChannel = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    const orderItemsChannel = supabase
      .channel("order_items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(orderItemsChannel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        customer_count,
        created_at,
        table:tables (id, table_number),
        package:packages (name),
        order_items (
          id,
          quantity,
          status,
          menu_item:menu_items (name, category)
        )
      `
      )
      .order("created_at", { ascending: false })
      .eq("status", "active");

    if (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive",
      });
    } else if (data) {
      setOrders(data);
    }
  };

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .eq("status", "available");
    if (error) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available tables. Please try again.",
        variant: "destructive",
      });
    } else if (data) {
      setTables(data);
    }
  };

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("is_available", true);
    if (error) {
      console.error("Error fetching packages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available packages. Please try again.",
        variant: "destructive",
      });
    } else if (data) {
      setPackages(data);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_id: newCustomer.table_id,
        package_id: newCustomer.package_id,
        customer_count: parseInt(newCustomer.customer_count),
        status: "active",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const { data: qrCodeData, error: qrCodeError } = await supabase
      .from("qr_codes")
      .insert({
        order_id: orderData.id,
        code: `http://localhost:3000/customer?order=${orderData.id}`,
      })
      .select()
      .single();

    if (qrCodeError) {
      console.error("Error creating QR code:", qrCodeError);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
      return;
    }

    await supabase
      .from("tables")
      .update({ status: "occupied" })
      .eq("id", newCustomer.table_id);

    setQrCode(qrCodeData.code);
    setNewCustomer({ table_id: "", package_id: "", customer_count: "" });
    setIsAddingCustomer(false);
    fetchTables();
    fetchOrders();
    toast({
      title: "Customer Added",
      description: "New customer has been added successfully.",
    });
  };

  const completeOrder = async (orderId: string, tableId: string) => {
    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: "completed", terminated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (orderError) {
      console.error("Error completing order:", orderError);
      toast({
        title: "Error",
        description: "Failed to complete order. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const { error: tableError } = await supabase
      .from("tables")
      .update({ status: "available" })
      .eq("id", tableId);

    if (tableError) {
      console.error("Error updating table status:", tableError);
      toast({
        title: "Error",
        description: "Failed to update table status. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const { error: qrCodeError } = await supabase
      .from("qr_codes")
      .update({ expired_at: new Date().toISOString() })
      .eq("order_id", orderId);

    if (qrCodeError) {
      console.error("Error expiring QR code:", qrCodeError);
      toast({
        title: "Warning",
        description: "Failed to expire QR code, but order was completed.",
        variant: "destructive",
      });
    }

    fetchOrders();
    fetchTables();
    toast({
      title: "Order Completed",
      description: "Order has been completed and table is now available.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
          <DialogTrigger asChild>
            <Button className="bg-black px-7 py-7 rounded-xl text-white hover:bg-[#242424] hover:text-white">
              Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <Label htmlFor="table">Table</Label>
                <Select
                  value={newCustomer.table_id}
                  onValueChange={(value) =>
                    setNewCustomer({ ...newCustomer, table_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {tables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        Table {table.table_number} (Capacity: {table.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="package">Package</Label>
                <Select
                  value={newCustomer.package_id}
                  onValueChange={(value) =>
                    setNewCustomer({ ...newCustomer, package_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="customer_count">Number of Customers</Label>
                <Input
                  id="customer_count"
                  type="number"
                  value={newCustomer.customer_count}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      customer_count: e.target.value,
                    })
                  }
                  min="1"
                  required
                />
              </div>
              <Button type="submit">Add Customer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {qrCode && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Customer QR Code</h2>
          <QRCodeSVG value={qrCode} />
          <Button
            onClick={() => {
              const svgString = new XMLSerializer().serializeToString(
                document.querySelector("svg")!
              );
              const blob = new Blob([svgString], {
                type: "image/svg+xml;charset=utf-8",
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "qrcode.svg";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="mt-2"
          >
            Download QR Code
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>
                Table {order.table.table_number} - {order.package.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Customers: {order.customer_count}</p>
              <p>Created: {new Date(order.created_at).toLocaleString()}</p>
              <h3 className="font-semibold mt-2">Items:</h3>
              <ul>
                {order.order_items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center"
                  >
                    <span>
                      {item.menu_item.name} - {item.quantity}{" "}
                      {item.menu_item.category === "drink" ? "pc" : "kg"}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => completeOrder(order.id, order.table.id)}
                className="mt-4"
              >
                Complete Order
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
