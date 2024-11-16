"use client";

import React, { useState, useEffect } from "react";
import Gallery from "@/components/admin/order/Gallery";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import Header from "@/components/HeaderBox";
import { getCookie } from "cookies-next";
import Swal from "sweetalert2";

interface DeviceStatus {
  device_id: string;
  quantity: number;
  package_order: string;
  device_name: string;
  is_active: boolean;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  imageSrc: string;
  quantity: number;
}

function Page() {
  const [orderItems, setOrderItems] = useState<MenuItem[]>([]);
  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [quantity, setQuantity] = useState(50);
  const [packageOrder, setPackageOrder] = useState<string>("");

  useEffect(() => {
    const deviceId = getCookie("device_id");
    if (deviceId) {
      fetchDeviceInfo(deviceId);

      const deviceChannel = supabase
        .channel("device_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "device_table",
            filter: `device_id=eq.${deviceId}`,
          },
          (payload) => {
            console.log("Device change received!", payload);
            if (
              payload.eventType === "UPDATE" ||
              payload.eventType === "INSERT"
            ) {
              setDevice(payload.new as DeviceStatus);
              setPackageOrder(payload.new.package_order);
            } else if (payload.eventType === "DELETE") {
              setDevice(null);
              setPackageOrder("");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(deviceChannel);
      };
    }
  }, []);

  useEffect(() => {
    if (packageOrder) {
      fetchMenuItems();

      const menuChannel = supabase
        .channel("menu_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: packageOrder,
          },
          (payload) => {
            console.log("Menu change received!", payload);
            fetchMenuItems();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(menuChannel);
      };
    }
  }, [packageOrder]);

  const fetchDeviceInfo = async (deviceId: string) => {
    const { data, error } = await supabase
      .from("device_table")
      .select()
      .eq("device_id", deviceId)
      .single();
    if (error) {
      console.error("Error fetching device:", error);
    } else {
      setDevice(data);
      setPackageOrder(data.package_order);
    }
  };

  const fetchMenuItems = async () => {
    if (packageOrder) {
      const { data, error } = await supabase.from(packageOrder).select();
      if (error) {
        console.error("Error fetching menu items:", error);
      } else {
        setMenuItems(data);
      }
    }
  };

  const addToOrder = (item: MenuItem) => {
    setOrderItems((prevOrderItems) => {
      const itemExists = prevOrderItems.find(
        (orderItem) => orderItem.name === item.name
      );

      if (itemExists) {
        return prevOrderItems.map((orderItem) =>
          orderItem.name === item.name
            ? { ...orderItem, quantity: orderItem.quantity + 50 }
            : orderItem
        );
      } else {
        return [...prevOrderItems, { ...item, quantity }];
      }
    });
  };

  const submitOrder = async () => {
    if (!device) {
      console.error("Device information not available");
      return;
    }

    const orderData = {
      device_id: device.device_id,
      order_items: orderItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })),
      order_date: new Date().toISOString(),
      status: "pending",
    };

    const { data, error } = await supabase.from("orders").insert(orderData);

    if (error) {
      console.error("Error submitting order:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong! Please try again.",
      });
    } else {
      console.log("Order submitted successfully:", data);
      Swal.fire({
        icon: "success",
        title: "Order Submitted!",
        text: "Your order has been successfully placed.",
      });
      // Clear the order items after successful submission
      setOrderItems([]);
    }
  };

  const incrementQuantity = (itemName: string) => {
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.name === itemName
          ? { ...item, quantity: item.quantity + 50 }
          : item
      )
    );
  };

  const decrementQuantity = (itemName: string) => {
    setOrderItems((prevItems) =>
      prevItems
        .map((item) =>
          item.name === itemName && item.quantity > 50
            ? { ...item, quantity: item.quantity - 50 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  return (
    <div className="min-h-[100%] w-full flex">
      <div className="flex flex-col gap-5 w-full mr-5">
        <Header title={device ? device.device_name : "Loading..."} />
        <div className="flex gap-5">
          <Button>Main</Button>
          <Button>Sides</Button>
          <Button>Drinks</Button>
          <Button>Utilities</Button>
        </div>
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8 mt-6">
          {menuItems.map((item, index) => (
            <Gallery
              key={index}
              name={item.name}
              description={item.description}
              quantity={item.quantity}
              onAddToOrder={() => addToOrder(item)}
            />
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-gray-200 p-5 border-1 border-gray-300 relative ">
        <h1>Order List</h1>
        <div className="grid border mt-5 gap-2 overflow-y-auto max-h-[46rem]">
          {orderItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between border bg-white p-2 w-[rem]"
            >
              <p>{item.name}</p>
              <div className="flex justify-center items-center gap-4">
                <Minus onClick={() => decrementQuantity(item.name)} />
                <p>{item.quantity}g</p>
                <Plus onClick={() => incrementQuantity(item.name)} />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 w-full">
          <Button
            className="bg-green-400 w-full hover:bg-green-400"
            onClick={submitOrder}
          >
            Order
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Page;
