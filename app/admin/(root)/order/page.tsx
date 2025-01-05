"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import NewOrderDialog from "@/components/admin/order/newOrderDialog";

// TypeScript interfaces
interface Order {
  id: string;
  table_number: number;
  status: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  status: string;
  menu_item_name: string;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchOrderItems();
  }, []);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        tables (
          table_number
        )
      `
      )
      .neq("status", "completed") // Exclude completed orders
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(
        data.map((order) => ({
          ...order,
          table_number: order.tables[0].table_number,
        }))
      );
    }
  }

  async function fetchOrderItems() {
    const { data, error } = await supabase
      .from("order_items")
      .select(
        `
        id,
        order_id,
        menu_item_id,
        quantity,
        status,
        menu_items (
          name
        )
      `
      )
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching order items:", error);
    } else {
      setOrderItems(
        data.map((item) => ({
          ...item,
          menu_item_name: item.menu_items[0].name,
        }))
      );
    }
  }

  async function updateOrderItemStatus(
    itemId: string,
    newStatus: string,
    orderId: string
  ) {
    const { error } = await supabase
      .from("order_items")
      .update({ status: newStatus })
      .eq("id", itemId);

    if (error) {
      console.error("Error updating order item status:", error);
    } else {
      if (newStatus === "served") {
        const { data: remainingItems } = await supabase
          .from("order_items")
          .select("id")
          .eq("order_id", orderId)
          .neq("status", "served");

        if (remainingItems && remainingItems.length === 0) {
          await supabase
            .from("orders")
            .update({ status: "completed" })
            .eq("id", orderId);
        }
      }
      // Refresh orders and order items after update
      fetchOrders();
      fetchOrderItems();
    }
  }

  const handleOrderCreated = () => {
    fetchOrders();
    fetchOrderItems();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Order Management</h1>
        <NewOrderDialog onOrderCreated={handleOrderCreated} />
      </div>

      {orders.map((order) => {
        const activeItems = orderItems.filter(
          (item) => item.order_id === order.id && item.status !== "served"
        );
        if (activeItems.length === 0) return null; // Don't render orders with no active items

        return (
          <div key={order.id} className="mb-8 p-4 border rounded shadow">
            <h2 className="text-xl font-semibold mb-2">
              Order for Table {order.table_number} - Status: {order.status}
            </h2>
            <div className="space-y-4">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-gray-100 rounded"
                >
                  <div>
                    <span className="font-medium">{item.menu_item_name}</span>
                    <span className="ml-2 text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      Status: {item.status}
                    </span>
                  </div>
                  <div>
                    {item.status === "pending" && (
                      <button
                        onClick={() =>
                          updateOrderItemStatus(item.id, "preparing", order.id)
                        }
                        className="px-3 py-1 bg-yellow-500 text-white rounded mr-2"
                      >
                        Preparing
                      </button>
                    )}
                    {item.status === "preparing" && (
                      <button
                        onClick={() =>
                          updateOrderItemStatus(item.id, "served", order.id)
                        }
                        className="px-3 py-1 bg-green-500 text-white rounded"
                      >
                        Served
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
