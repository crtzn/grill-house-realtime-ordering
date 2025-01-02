"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";
import { Plus, Minus, Trash2 } from "lucide-react";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  is_available: boolean;
};

type OrderItem = {
  id: string;
  menu_item_id: string;
  quantity: number;
  status: "pending" | "preparing" | "served" | "cancelled";
};

type Order = {
  id: string;
  table_id: string;
  package_id: string;
  customer_count: number;
  status: "pending" | "active" | "completed" | "cancelled";
  total_price: number;
  notes: string;
  tables: { table_number: number };
  packages: {
    name: string;
    package_items: {
      menu_items: MenuItem;
    }[];
  };
};

export default function CustomerOrderingPage({
  initialOrder,
}: {
  initialOrder: Order;
}) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const menuItems = order.packages.package_items.map(
      (item) => item.menu_items
    );
    setMenuItems(menuItems);

    fetchOrderItems();

    const orderItemsSubscription = supabase
      .channel("order-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
          filter: `order_id=eq.${order.id}`,
        },
        (payload) => {
          console.log("Change received!", payload);
          fetchOrderItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderItemsSubscription);
    };
  }, [order.id]);

  const fetchOrderItems = async () => {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    if (error) {
      console.error("Error fetching order items:", error);
    } else {
      setOrderItems(data);
    }
  };

  const addToOrder = async (menuItem: MenuItem) => {
    const existingItem = orderItems.find(
      (item) => item.menu_item_id === menuItem.id && item.status === "pending"
    );

    if (existingItem) {
      await updateOrderItemQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const { error } = await supabase.from("order_items").insert({
        order_id: order.id,
        menu_item_id: menuItem.id,
        quantity: 1,
        status: "pending",
      });

      if (error) {
        console.error("Error adding item to order:", error);
      }
    }
  };

  const updateOrderItemQuantity = async (
    orderItemId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      await removeOrderItem(orderItemId);
    } else {
      const { error } = await supabase
        .from("order_items")
        .update({ quantity: newQuantity })
        .eq("id", orderItemId);

      if (error) {
        console.error("Error updating order item quantity:", error);
      }
    }
  };

  const removeOrderItem = async (orderItemId: string) => {
    const { error } = await supabase
      .from("order_items")
      .delete()
      .eq("id", orderItemId);

    if (error) {
      console.error("Error removing order item:", error);
    }
  };

  const updateOrderItemStatus = async (
    orderItemId: string,
    newStatus: OrderItem["status"]
  ) => {
    const { error } = await supabase
      .from("order_items")
      .update({ status: newStatus })
      .eq("id", orderItemId);

    if (error) {
      console.error("Error updating order item status:", error);
    }
  };

  const checkout = async () => {
    // Implement checkout logic here
    console.log("Checkout clicked");
  };

  const categories = Array.from(
    new Set(menuItems.map((item) => item.category))
  );

  const filteredMenuItems = selectedCategory
    ? menuItems.filter((item) => item.category === selectedCategory)
    : menuItems;

  return (
    <div className="flex h-screen">
      <div className="w-3/4 p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">
          Table {order.tables.table_number}
        </h1>
        <div className="mb-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`mr-2 px-4 py-2 rounded ${
                selectedCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {filteredMenuItems.map((item) => (
            <div key={item.id} className="border p-4 rounded">
              <Image
                src={item.image_url}
                alt={item.name}
                width={200}
                height={200}
                className="w-full h-40 object-cover mb-2"
              />
              <h3 className="font-bold">{item.name}</h3>
              <p className="text-sm">{item.description}</p>
              <button
                onClick={() => addToOrder(item)}
                className="mt-2 bg-green-500 text-white px-4 py-2 rounded w-full"
              >
                Add to Order
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Your Order</h2>
        {["pending", "preparing", "served"].map((stage) => (
          <div key={stage} className="mb-4">
            <h3 className="font-bold capitalize">{stage}</h3>
            {orderItems
              .filter((item) => item.status === stage)
              .map((item) => {
                const menuItem = menuItems.find(
                  (mi) => mi.id === item.menu_item_id
                );
                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-center mb-2"
                  >
                    <span>{menuItem?.name}</span>
                    {stage === "pending" ? (
                      <div className="flex items-center">
                        <button
                          onClick={() =>
                            updateOrderItemQuantity(item.id, item.quantity - 1)
                          }
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="bg-white px-2 py-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateOrderItemQuantity(item.id, item.quantity + 1)
                          }
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeOrderItem(item.id)}
                          className="ml-2 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span>x {item.quantity}</span>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
        <button
          onClick={checkout}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded mt-4"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
