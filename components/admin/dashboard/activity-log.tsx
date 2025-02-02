"use client";

import { useState } from "react";
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

// Types based on the database schema
type Order = {
  id: string;
  table_number: string;
  package_id: string;
  customer_count: number;
  created_at: string;
  package: {
    name: string;
    price: number;
  };
  order_addons: Array<{
    id: string;
    quantity: number;
    addon: {
      name: string;
      price: number;
    };
  }>;
};

export function ActivityLog({ orders }: { orders: Order[] }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const calculateTotal = (order: Order) => {
    const packageTotal = order.package.price * order.customer_count;
    const addonsTotal = order.order_addons.reduce((sum, addon) => {
      return sum + addon.addon.price * addon.quantity;
    }, 0);
    return packageTotal + addonsTotal;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Customers</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Add-ons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>Table {order.table_number}</TableCell>
                <TableCell>{order.package.name}</TableCell>
                <TableCell>{order.customer_count}</TableCell>
                <TableCell>₱{calculateTotal(order).toLocaleString()}</TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                              <TableCell>{addon.addon.name}</TableCell>
                              <TableCell>{addon.quantity}</TableCell>
                              <TableCell>₱{addon.addon.price}</TableCell>
                              <TableCell>
                                ₱
                                {(
                                  addon.quantity * addon.addon.price
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
