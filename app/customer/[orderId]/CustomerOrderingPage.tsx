"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";
import { Plus, Minus, Trash2, Menu, X } from "lucide-react";
import { DigitalReceiptModal } from "@/app/customer/[orderId]/DigitalReceiptModal";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  is_available: boolean;
  price: number; // Added price field
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

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
      .select(
        `
      *,
      menu_items:menu_item_id (
        id,
        name,
        price
      )
    `
      )
      .eq("order_id", order.id);

    if (error) {
      console.error("Error fetching order items:", error);
    } else {
      setOrderItems(data);
    }
  };

  const addToOrder = async (menuItem: MenuItem) => {
    if (!menuItem.is_available) return;

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
    // Here you would typically update the order status in the database
    // For now, we'll just open the receipt modal
    setIsReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setIsReceiptModalOpen(false);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menu_item_id);
      // Assuming each menu item has a price field. If not, you'll need to adjust this.
      const price = menuItem?.price || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const receiptItems = orderItems.map((item) => {
    const menuItem = menuItems.find((mi) => mi.id === item.menu_item_id);
    return {
      name: menuItem?.name || "Unknown Item",
      quantity: item.quantity,
      price: menuItem?.price || 0, // Assuming each menu item has a price field
    };
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const categories = Array.from(
    new Set(menuItems.map((item) => item.category))
  );

  const filteredMenuItems = selectedCategory
    ? menuItems.filter((item) => item.category === selectedCategory)
    : menuItems;

  return (
    <div className="flex flex-col h-screen md:flex-row">
      <div className="w-full md:w-3/4 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            Table {order.tables.table_number}
          </h1>
          <button
            onClick={toggleSidebar}
            className="md:hidden bg-blue-500 text-white p-2 rounded"
          >
            <Menu />
          </button>
        </div>
        <div className="mb-4 flex flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`mr-2 mb-2 px-4 py-2 rounded ${
                selectedCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredMenuItems.map((item) => (
            <div key={item.id} className="border p-4 rounded relative">
              <div className="relative">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  width={200}
                  height={200}
                  className="w-full h-40 object-cover mb-2"
                />
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      Unavailable
                    </span>
                  </div>
                )}
              </div>
              <h3 className="font-bold">{item.name}</h3>
              <p className="text-sm">{item.description}</p>
              <button
                onClick={() => addToOrder(item)}
                className={`mt-2 px-4 py-2 rounded w-full ${
                  item.is_available
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!item.is_available}
              >
                {item.is_available ? "Add to Order" : "Unavailable"}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div
        className={`w-full md:w-1/4 bg-gray-100 p-4 overflow-y-auto fixed inset-y-0 right-0 transform ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Order</h2>
          <button
            onClick={toggleSidebar}
            className="md:hidden bg-red-500 text-white p-2 rounded"
          >
            <X />
          </button>
        </div>
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
      <DigitalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={closeReceiptModal}
        tableNumber={order.tables.table_number}
        items={receiptItems}
        total={calculateTotal()}
      />
    </div>
  );
}
