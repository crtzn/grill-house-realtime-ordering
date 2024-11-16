"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
}

interface Table {
  id: number;
  number: string;
  orderCount: number;
  orders: OrderItem[];
}

export default function OrderSection() {
  const [tables] = React.useState<Table[]>([
    {
      id: 1,
      number: "01",
      orderCount: 1,
      orders: [
        { id: 1, name: "KIMCHI", quantity: 0 },
        { id: 2, name: "KIMCHI", quantity: 0 },
        { id: 3, name: "KIMCHI", quantity: 0 },
      ],
    },
    {
      id: 2,
      number: "02",
      orderCount: 3,
      orders: [
        { id: 1, name: "KIMCHI", quantity: 0 },
        { id: 2, name: "KIMCHI", quantity: 0 },
        { id: 3, name: "KIMCHI", quantity: 0 },
      ],
    },
    {
      id: 3,
      number: "03",
      orderCount: 2,
      orders: [
        { id: 1, name: "KIMCHI", quantity: 0 },
        { id: 2, name: "KIMCHI", quantity: 0 },
        { id: 3, name: "KIMCHI", quantity: 0 },
      ],
    },
  ]);

  const handleDeliver = (tableId: number, orderId: number) => {
    console.log(`Delivering order ${orderId} for table ${tableId}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Order</h1>
      </div>

      <div className="flex gap-4">
        {tables.map((table) => (
          <Dialog key={table.id}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-24 w-48 relative">
                <span>Table {table.number}</span>
                <div className="absolute -top-2 -right-2 bg-red-100 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  {table.orderCount}
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>Table {table.number} Orders</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {table.orders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="text-sm font-medium">{order.name}</div>

                      <Input
                        type="number"
                        value={order.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          // Handle quantity change
                        }}
                        className="h-8"
                        placeholder="Quantity"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeliver(table.id, order.id)}
                    >
                      Deliver
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
