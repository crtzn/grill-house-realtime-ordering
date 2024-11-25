"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
}

interface OrderItem {
  menu_item_id: string;
  quantity: number;
  name: string;
  category: string;
}

export default function CustomerOrder() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [categories, setCategories] = useState<string[]>([
    "main",
    "side",
    "drink",
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      toast({
        title: "Error",
        description: "Invalid order ID. Please scan the QR code again.",
        variant: "destructive",
      });
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          package_id,
          table:tables (table_number)
        `
        )
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      setTableNumber(orderData.table.table_number);

      const { data: packageItems, error: packageError } = await supabase
        .from("package_items")
        .select("menu_item_id")
        .eq("package_id", orderData.package_id);

      if (packageError) throw packageError;

      const menuItemIds = packageItems.map((item) => item.menu_item_id);

      const { data: items, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .in("id", menuItemIds);

      if (menuError) throw menuError;

      setMenuItems(items);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch order details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToOrder = (item: MenuItem) => {
    setOrderItems((prevItems) => {
      const existingItem = prevItems.find(
        (orderItem) => orderItem.menu_item_id === item.id
      );

      if (existingItem) {
        // If item already exists in the order, just increase quantity
        return prevItems.map((orderItem) =>
          orderItem.menu_item_id === item.id
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      } else {
        // If item is not in the order, add it with quantity 1
        return [
          ...prevItems,
          {
            menu_item_id: item.id,
            quantity: 1,
            name: item.name,
            category: item.category,
          },
        ];
      }
    });

    if (!isOrderPanelOpen) {
      setIsOrderPanelOpen(true);
    }
  };

  const handleQuantityChange = (item: OrderItem, quantity: number) => {
    setOrderItems((prevItems) => {
      const updatedItems = prevItems.map((orderItem) =>
        orderItem.menu_item_id === item.menu_item_id
          ? { ...orderItem, quantity }
          : orderItem
      );
      return updatedItems;
    });
  };

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to your order before placing it.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("order_items").insert(
        orderItems.map((item) => ({
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          status: "pending",
        }))
      );

      if (error) throw error;

      setOrderItems([]);
      toast({
        title: "Order Placed",
        description: "Your order has been placed successfully.",
      });
      setIsOrderPanelOpen(false);
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredMenuItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Place Your Order</h1>
      {tableNumber && (
        <h2 className="text-xl mb-6">Table Number: {tableNumber}</h2>
      )}

      <div className="mb-4 flex gap-4">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => setSelectedCategory(category)}
            variant={selectedCategory === category ? "default" : "outline"}
            className="w-full"
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
        <Button
          onClick={() => setSelectedCategory("all")}
          variant={selectedCategory === "all" ? "default" : "outline"}
          className="w-full"
        >
          All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenuItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="p-0">
              {item.image_url && (
                <div className="relative w-full h-48">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="mb-2">{item.name}</CardTitle>
              <p className="text-sm text-gray-600 mb-4">{item.description}</p>
              <Button
                onClick={() => handleAddToOrder(item)}
                className="w-full bg-blue-500 text-white"
              >
                Add to Order
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div
        className={`fixed inset-y-0 right-0 w-80 bg-white shadow-lg p-6 transform transition-transform duration-300 ease-in-out ${
          isOrderPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Order</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOrderPanelOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        {orderItems.length === 0 ? (
          <p className="text-gray-500">No items in your order yet.</p>
        ) : (
          <>
            {orderItems.map((item) => (
              <div
                key={item.menu_item_id}
                className="flex justify-between items-center mb-4"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      handleQuantityChange(item, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item, parseInt(e.target.value))
                    }
                    type="number"
                    min="1"
                    className="w-12 text-center"
                  />
                  <Button
                    onClick={() =>
                      handleQuantityChange(item, item.quantity + 1)
                    }
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
            <Button
              onClick={handlePlaceOrder}
              className="w-full bg-green-500 text-white"
            >
              Place Order
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
