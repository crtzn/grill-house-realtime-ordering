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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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

export function ActivityLog() {
  const [orders, setOrders] = useState<Order[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Initial fetch
    fetchOrders();

    // Set up real-time subscription
    const channel = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function fetchOrders() {
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
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data || []);
    }
  }

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
        <CardTitle>Activity Log</CardTitle>
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
                  {new Date(order.created_at).toLocaleTimeString()}
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
