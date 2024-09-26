import React, { useState, useEffect } from "react";
import supabase from "@/lib/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  device_id: string;
  order_items: OrderItem[];
  device_name: string;
}

const OrderTable: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let orderSubscription: RealtimeChannel;

    const setupSubscription = async () => {
      await fetchOrders();

      orderSubscription = supabase
        .channel("order_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          (payload) => {
            console.log("Order change received!", payload);
            fetchOrders(); // Refetch all orders when any change occurs
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (orderSubscription) {
        supabase.removeChannel(orderSubscription);
      }
    };
  }, []);

  const fetchOrders = async () => {
    const { data: orderData, error: orderError } = await supabase.from("orders")
      .select(`
        id,
        device_id,
        order_items,
        device_table(device_name)
      `);

    if (orderError) {
      console.error("Error fetching orders:", orderError);
    } else if (orderData) {
      const formattedOrders: Order[] = orderData.map((order: any) => ({
        id: order.id,
        device_id: order.device_id,
        order_items: order.order_items, // No need to parse, it's already an object
        device_name: order.device_table.device_name,
      }));
      setOrders(formattedOrders);
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-xl font-bold mb-2">Table: {order.device_name}</h2>
          <ul className="list-disc list-inside">
            {order.order_items.map((item, index) => (
              <li key={index}>
                {item.name} - Quantity: {item.quantity}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default OrderTable;
