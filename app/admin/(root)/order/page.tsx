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

    const ordersSubscription = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Orders change received!", payload);
          handleOrderChange(payload);
        }
      )
      .subscribe();

    const orderItemsSubscription = supabase
      .channel("order_items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        (payload) => {
          console.log("Order items change received!", payload);
          handleOrderItemChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(orderItemsSubscription);
    };
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
      .neq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else if (data) {
      const formattedOrders: Order[] = data.map((order: any) => ({
        id: order.id,
        status: order.status,
        table_number: order.tables?.table_number,
      }));
      setOrders(formattedOrders);
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
    } else if (data) {
      const formattedOrderItems: OrderItem[] = data.map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        status: item.status,
        menu_item_name: item.menu_items?.name,
      }));
      setOrderItems(formattedOrderItems);
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
    }
  }

  const handleOrderChange = (payload: any) => {
    if (payload.eventType === "INSERT") {
      setOrders((prevOrders) => [payload.new, ...prevOrders]);
    } else if (payload.eventType === "UPDATE") {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === payload.new.id ? { ...order, ...payload.new } : order
        )
      );
    } else if (payload.eventType === "DELETE") {
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== payload.old.id)
      );
    }
  };

  const handleOrderItemChange = (payload: any) => {
    if (payload.eventType === "INSERT") {
      setOrderItems((prevItems) => [...prevItems, payload.new]);
    } else if (payload.eventType === "UPDATE") {
      setOrderItems((prevItems) =>
        prevItems.map((item) =>
          item.id === payload.new.id ? { ...item, ...payload.new } : item
        )
      );
    } else if (payload.eventType === "DELETE") {
      setOrderItems((prevItems) =>
        prevItems.filter((item) => item.id !== payload.old.id)
      );
    }
  };

  const handleOrderCreated = () => {
    console.log("New order created");
    fetchOrders();
    fetchOrderItems();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center align-middle">
        <h1 className="text-2xl font-bold mb-4">Order Management</h1>
        <NewOrderDialog onOrderCreated={handleOrderCreated} />
      </div>
      <div className="pt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => {
          const activeItems = orderItems.filter(
            (item) => item.order_id === order.id && item.status !== "served"
          );
          if (activeItems.length === 0) return null;

          return (
            <div key={order.id} className="mb-8 p-4 border rounded shadow-md">
              <h2 className="text-xl font-semibold mb-2">
                Order for Table {order.table_number}
              </h2>
              <div className="space-y-4">
                {activeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-gray-100 rounded"
                  >
                    <div className="mb-2 sm:mb-0">
                      <span className="font-medium">{item.menu_item_name}</span>
                      <span className="ml-2 text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        Status: {item.status}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      {item.status === "pending" && (
                        <button
                          onClick={() =>
                            updateOrderItemStatus(
                              item.id,
                              "preparing",
                              order.id
                            )
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
    </div>
  );
}
