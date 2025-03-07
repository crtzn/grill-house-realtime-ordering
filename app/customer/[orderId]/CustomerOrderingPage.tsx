"use client";

"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import DigitalReceiptModal from "@/app/customer/[orderId]/DigitalReceipt";
import type { Category } from "@/app/types";
import Swal from "sweetalert2";
import { useToast } from "@/hooks/use-toast";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";
import { motion } from "framer-motion";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  categories?: {
    id: string;
    name: string;
  };
  image_url: string;
  is_available: boolean;
};

type AddOns = {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  image_url: string;
};

type DisplayItem = {
  id: string;
  name: string;
  description: string;
  is_available: boolean;
  image_url: string;
  isAddOn?: boolean;
};

type OrderItem = {
  id: string;
  menu_item_id: string;
  quantity: number;
  status: "confirming" | "pending" | "preparing" | "served" | "cancelled";
};

type OrderAddOn = {
  id: string;
  order_id: string;
  addon_id: string;
  quantity: number;
  status: "confirming" | "pending" | "preparing" | "served";
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
  const { toast } = useToast();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderAddOns, setOrderAddOns] = useState<OrderAddOn[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [addOns, setAddOns] = useState<AddOns[]>([]);
  const [showingAddOns, setShowingAddOns] = useState(false);

  const MAX_ITEMS_PER_MENU_ITEM = 5;

  useEffect(() => {
    const fetchMenuItems = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*, categories(id, name)")
        .in(
          "id",
          order.packages.package_items.map((item) => item.menu_items.id)
        );

      if (error) {
        console.error("Error fetching menu items:", error);
      } else {
        setMenuItems(data);
      }
    };

    fetchMenuItems();
    fetchOrderItems();
    fetchCategories();
    fetchAddOns();
    fetchOrderAddOns();

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
          console.log("Order item change received!", payload);
          fetchOrderItems();
        }
      )
      .subscribe();

    const addOnsSubscription = supabase
      .channel("add-ons")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "add_ons" },
        (payload) => {
          console.log("Add-on change received!", payload);
          fetchAddOns();
        }
      )
      .subscribe();

    const menuItemsSubscription = supabase
      .channel("menu-items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        (payload) => {
          console.log("Menu item change received!", payload);
          fetchMenuItems();
        }
      )
      .subscribe();

    const orderAddOnsSubscription = supabase
      .channel("order-addons")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_addons",
          filter: `order_id=eq.${order.id}`,
        },
        (payload) => {
          console.log("Order add-on change received!", payload);
          fetchOrderAddOns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderItemsSubscription);
      supabase.removeChannel(addOnsSubscription);
      supabase.removeChannel(menuItemsSubscription);
      supabase.removeChannel(orderAddOnsSubscription);
    };
  }, [order.id, order.packages.package_items]); // Added order.packages.package_items to dependencies

  const fetchOrderAddOns = async () => {
    const { data, error } = await supabase
      .from("order_addons")
      .select("*")
      .eq("order_id", order.id);

    if (error) {
      console.error("Error fetching order add-ons:", error);
    } else {
      setOrderAddOns(data);
    }
  };

  const fetchAddOns = async () => {
    const { data, error } = await supabase
      .from("add_ons")
      .select("*")
      .eq("is_available", true);

    if (error) throw error;
    setAddOns(data);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.log("Error fetch data:", error);
    }
  };

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
    if (!menuItem.is_available) {
      console.error("This item is not available");
      return;
    }

    const existingItem = orderItems.find(
      (item) =>
        item.menu_item_id === menuItem.id && item.status === "confirming"
    );

    if (existingItem) {
      if (existingItem.quantity >= MAX_ITEMS_PER_MENU_ITEM) {
        alert(
          `You can only order up to ${MAX_ITEMS_PER_MENU_ITEM} of each item`
        );
        return;
      }
      await updateOrderItemQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const { error } = await supabase.from("order_items").insert({
        order_id: order.id,
        menu_item_id: menuItem.id,
        quantity: 1,
        status: "confirming",
      });

      if (error) {
        console.error("Error adding item to order:", error);
      }
    }
  };

  const addAddOnToOrder = async (addOn: AddOns) => {
    if (!addOn.is_available) {
      toast({
        title: "Error",
        description: "This add-on is not available",
        variant: "destructive",
      });
      return;
    }

    const existingAddOn = orderAddOns.find(
      (ao) => ao.addon_id === addOn.id && ao.status === "confirming"
    );

    if (existingAddOn) {
      if (existingAddOn.quantity >= MAX_ITEMS_PER_MENU_ITEM) {
        alert(
          `You can only order up to ${MAX_ITEMS_PER_MENU_ITEM} of each item`
        );
        return;
      }
      await updateOrderAddOnQuantity(
        existingAddOn.id,
        existingAddOn.quantity + 1
      );
    } else {
      const { error } = await supabase.from("order_addons").insert({
        order_id: order.id,
        addon_id: addOn.id,
        quantity: 1,
        status: "confirming",
      });

      if (error) {
        console.error("Error adding add-on to order:", error);
      }
    }
  };

  const updateOrderItemQuantity = async (
    orderItemId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      await removeOrderItem(orderItemId);
    } else if (newQuantity > MAX_ITEMS_PER_MENU_ITEM) {
      alert(`You can only order up to ${MAX_ITEMS_PER_MENU_ITEM} of each item`);
      return;
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

  const updateOrderAddOnQuantity = async (
    orderAddOnId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      await removeOrderAddOn(orderAddOnId);
    } else if (newQuantity > MAX_ITEMS_PER_MENU_ITEM) {
      alert(`You can only order up to ${MAX_ITEMS_PER_MENU_ITEM} of each item`);
      return;
    } else {
      const { error } = await supabase
        .from("order_addons")
        .update({ quantity: newQuantity })
        .eq("id", orderAddOnId);

      if (error) {
        console.error("Error updating order add-on quantity:", error);
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
    } else {
      setOrderItems((prevOrderItems) =>
        prevOrderItems.filter((item) => item.id !== orderItemId)
      );
    }
  };

  const removeOrderAddOn = async (orderAddOnId: string) => {
    const { error } = await supabase
      .from("order_addons")
      .delete()
      .eq("id", orderAddOnId);

    if (error) {
      console.error("Error removing order add-on:", error);
    } else {
      setOrderAddOns((prevOrderAddOns) =>
        prevOrderAddOns.filter((ao) => ao.id !== orderAddOnId)
      );
    }
  };

  const checkout = async () => {
    try {
      const result = await Swal.fire({
        title: "Checkout Options",
        text: "What would you like to do?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Checkout",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
      });

      if (result.isDenied) {
        setIsReceiptModalOpen(false);
        return;
      }

      if (result.isConfirmed) {
        const confirmResult = await Swal.fire({
          title: "Confirm Checkout",
          text: "Are you sure you want to proceed with the checkout?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, checkout!",
        });

        if (confirmResult.isConfirmed) {
          const { error: orderError } = await supabase
            .from("orders")
            .update({
              status: "completed",
              payment_status: "paid",
              terminated_at: new Date().toISOString(),
            })
            .eq("id", order.id);

          const { error: deleteOrderItemsError } = await supabase
            .from("order_items")
            .delete()
            .eq("order_id", order.id)
            .neq("status", "served");

          if (deleteOrderItemsError) {
            throw deleteOrderItemsError;
          }

          const { error: deleteAddOnsError } = await supabase
            .from("order_addons")
            .delete()
            .eq("order_id", order.id)
            .neq("status", ["preparing", "served"]);

          if (deleteAddOnsError) {
            throw deleteAddOnsError;
          }

          // Update the status of "preparing" add-ons to "served"
          const { error: updateAddOnsStatusError } = await supabase
            .from("order_addons")
            .update({ status: "served" })
            .eq("order_id", order.id)
            .eq("status", "preparing");

          if (updateAddOnsStatusError) {
            throw updateAddOnsStatusError;
          }

          const { error: tableError } = await supabase
            .from("tables")
            .update({ status: "available" })
            .eq("id", order.table_id);

          if (tableError) {
            throw tableError;
          }

          const { error: deleteQrError } = await supabase
            .from("qr_codes")
            .delete()
            .eq("order_id", order.id);

          if (deleteQrError) {
            throw deleteQrError;
          }

          const { error: qrError } = await supabase
            .from("qr_codes")
            .update({
              expired_at: new Date().toISOString(),
            })
            .eq("order_id", order.id);

          if (qrError) {
            throw qrError;
          }

          await Swal.fire({
            title: "Success!",
            text: "Checkout completed successfully",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });

          setIsReceiptModalOpen(true);
          // Disable further interactions
          document.body.style.pointerEvents = "none";
        }
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      await Swal.fire({
        title: "Error",
        text: "There was an error processing your checkout. Please try again.",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  const confirmOrderItem = async (orderItemId: string) => {
    const { error } = await supabase
      .from("order_items")
      .update({ status: "pending" })
      .eq("id", orderItemId);

    if (error) {
      console.error("Error confirming order item:", error);
    } else {
      console.log("Order item confirmed and moved to pending.");
    }
  };

  const confirmOrderAddOn = async (orderAddOnId: string) => {
    const { error } = await supabase
      .from("order_addons")
      .update({ status: "pending" })
      .eq("id", orderAddOnId);

    if (error) {
      console.error("Error confirming order add-on:", error);
    } else {
      console.log("Order add-on confirmed and moved to pending.");
    }
  };

  const updateQuantity = async (menuItemId: string, delta: number) => {
    const existingItem = orderItems.find(
      (item) => item.menu_item_id === menuItemId && item.status === "confirming"
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + delta;
      if (newQuantity < 1) {
        await removeOrderItem(existingItem.id);
      } else if (newQuantity > MAX_ITEMS_PER_MENU_ITEM) {
        alert(
          `You can only order up to ${MAX_ITEMS_PER_MENU_ITEM} of each item`
        );
      } else {
        await updateOrderItemQuantity(existingItem.id, newQuantity);
      }
    } else {
      await addToOrder(menuItems.find((mi) => mi.id === menuItemId)!);
    }
  };

  // Get display items based on selected category or add-ons
  const getDisplayItems = (): DisplayItem[] => {
    if (showingAddOns) {
      return addOns
        .filter((addOn) => addOn.is_available)
        .map((addOn) => ({
          id: addOn.id,
          name: addOn.name,
          description: `₱${addOn.price.toFixed(2)}`,
          is_available: addOn.is_available,
          image_url: addOn.image_url || "/api/placeholder/400/320",
          isAddOn: true,
        }));
    }

    return selectedCategory
      ? menuItems
          .filter((item) => item.categories?.id === selectedCategory)
          .map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            is_available: item.is_available,
            image_url: item.image_url || "/api/placeholder/400/320",
            isAddOn: false,
          }))
      : menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          is_available: item.is_available,
          image_url: item.image_url || "/api/placeholder/400/320",
          isAddOn: false,
        }));
  };

  const pendingItemsCount = orderItems.filter(
    (item) => item.status === "confirming"
  ).length;

  return (
    <div className="flex flex-col h-screen md:flex-row">
      {/* Mobile Cart Toggle Button */}
      <button
        onClick={() => setShowCart(!showCart)}
        className="fixed bottom-4 right-4 md:hidden z-50 bg-red-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
      >
        <ShoppingCart className="w-6 h-6" />
        {pendingItemsCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#212121] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
            {pendingItemsCount}
          </span>
        )}
      </button>

      {/* Menu Section */}
      <div
        className={`w-full md:w-3/4 p-4 overflow-y-auto ${
          showCart ? "hidden md:block" : "block"
        }`}
      >
        <h1 className="text-2xl font-bold mb-4">
          Table {order.tables.table_number}
        </h1>

        {/* Categories Scrollable Container */}
        <div className="mb-4 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
          <div className="inline-flex space-x-2 p-1">
            <Button
              onClick={() => {
                setSelectedCategory(null);
                setShowingAddOns(false);
              }}
              className={`${
                selectedCategory === null && !showingAddOns
                  ? "bg-[#383838] text-white"
                  : "bg-[#242424] text-white"
              } px-4 py-2 hover:bg-[#383838] hover:text-white text-sm md:text-base flex-shrink-0`}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  );
                  setShowingAddOns(false);
                }}
                className={`${
                  selectedCategory === category.id
                    ? "bg-[#383838] text-white"
                    : "bg-[#242424] text-white"
                } px-4 py-2 hover:bg-[#383838] hover:text-white text-sm md:text-base flex-shrink-0`}
              >
                {category.name}
              </Button>
            ))}
            <Button
              onClick={() => {
                setShowingAddOns(!showingAddOns);
                setSelectedCategory(null);
              }}
              className={`${
                showingAddOns
                  ? "bg-[#383838] text-white"
                  : "bg-[#242424] text-white"
              } px-4 py-2 hover:bg-[#383838] hover:text-white text-sm md:text-base flex-shrink-0`}
            >
              Add-ons
            </Button>
          </div>
        </div>

        {/* Responsive Swiper */}
        <div className="w-full max-w-md mx-auto md:max-w-lg lg:max-w-xl">
          <Swiper
            effect={"cards"}
            grabCursor={true}
            modules={[EffectCards]}
            className="mySwiper h-[450px] md:h-[500px]"
          >
            {getDisplayItems().map((item) => (
              <SwiperSlide key={item.id}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="border p-4 rounded-lg shadow-lg bg-white h-full"
                >
                  <div className="relative w-full pt-[75%]">
                    <Image
                      src={item.image_url || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="absolute top-0 left-0 w-full h-full object-cover rounded"
                      unoptimized={true}
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-bold text-lg md:text-xl">
                      {item.name}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600">
                      {item.description}
                    </p>
                  </div>
                  {item.isAddOn ? (
                    <button
                      onClick={() =>
                        addAddOnToOrder(addOns.find((a) => a.id === item.id)!)
                      }
                      className={`mt-4 px-4 py-2 rounded w-full ${
                        !item.is_available
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                      disabled={!item.is_available}
                    >
                      {!item.is_available ? "Unavailable" : "Add to Order"}
                    </button>
                  ) : (
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="bg-white px-4 py-1">
                          {orderItems.find(
                            (oi) =>
                              oi.menu_item_id === item.id &&
                              oi.status === "confirming"
                          )?.quantity || 0}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          addToOrder(menuItems.find((mi) => mi.id === item.id)!)
                        }
                        className={`mt-2 px-4 py-2 rounded w-full ${
                          !item.is_available
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                        disabled={!item.is_available}
                      >
                        {!item.is_available ? "Unavailable" : "Add to Order"}
                      </button>
                    </div>
                  )}
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Cart Section */}
      <div
        className={`w-full md:w-1/4 bg-gray-100 p-4 fixed md:static inset-0 z-40 transform transition-transform duration-300 ease-in-out ${
          showCart ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col">
          <button
            onClick={() => setShowCart(false)}
            className="md:hidden absolute top-4 right-4 text-gray-600"
          >
            ✕
          </button>

          <h2 className="text-xl font-bold mb-4">Your Order</h2>

          {/* Scrollable Order Sections */}
          <div className="flex-1 overflow-y-auto">
            {["confirming", "pending", "preparing"].map((stage) => {
              const items = [
                ...orderItems.filter((item) => item.status === stage),
                ...orderAddOns.filter((addOn) => addOn.status === stage),
              ];

              return items.length > 0 ? (
                <div key={stage} className="mb-4">
                  <h3 className="font-bold capitalize mb-2 sticky top-0 bg-gray-100 py-2 z-10">
                    {stage}
                  </h3>
                  <div className="space-y-2">
                    {/* Regular menu items */}
                    {orderItems
                      .filter((item) => item.status === stage)
                      .map((item) => {
                        const menuItem = menuItems.find(
                          (mi) => mi.id === item.menu_item_id
                        );
                        return (
                          <div
                            key={item.id}
                            className="flex flex-wrap justify-between items-center bg-white p-2 rounded shadow-sm"
                          >
                            <span className="w-full sm:w-auto text-sm md:text-base mb-2 sm:mb-0">
                              {menuItem?.name}
                            </span>
                            {stage === "confirming" ? (
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  <button
                                    onClick={() =>
                                      updateOrderItemQuantity(
                                        item.id,
                                        item.quantity - 1
                                      )
                                    }
                                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="bg-white px-3 py-1">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateOrderItemQuantity(
                                        item.id,
                                        item.quantity + 1
                                      )
                                    }
                                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeOrderItem(item.id)}
                                  className="text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => confirmOrderItem(item.id)}
                                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                                >
                                  Confirm
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm">x{item.quantity}</span>
                            )}
                          </div>
                        );
                      })}

                    {/* Add-ons */}
                    {orderAddOns
                      .filter((addOn) => addOn.status === stage)
                      .map((addOn) => {
                        const addOnItem = addOns.find(
                          (a) => a.id === addOn.addon_id
                        );
                        return (
                          <div
                            key={addOn.id}
                            className="flex flex-wrap justify-between items-center bg-white p-2 rounded shadow-sm"
                          >
                            <span className="w-full sm:w-auto text-sm md:text-base mb-2 sm:mb-0">
                              {addOnItem?.name} (Add-on)
                            </span>
                            {stage === "confirming" ? (
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  <button
                                    onClick={() =>
                                      updateOrderAddOnQuantity(
                                        addOn.id,
                                        addOn.quantity - 1
                                      )
                                    }
                                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="bg-white px-3 py-1">
                                    {addOn.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateOrderAddOnQuantity(
                                        addOn.id,
                                        addOn.quantity + 1
                                      )
                                    }
                                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeOrderAddOn(addOn.id)}
                                  className="text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => confirmOrderAddOn(addOn.id)}
                                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                                >
                                  Confirm
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm">x{addOn.quantity}</span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : null;
            })}
            {/* Separate Served Section with Fixed Height */}
            {(() => {
              const servedItems = [
                ...orderItems.filter((item) => item.status === "served"),
                ...orderAddOns.filter((addOn) => addOn.status === "served"),
              ];

              return servedItems.length > 0 ? (
                <div className="mb-4">
                  <h3 className="font-bold capitalize mb-2 sticky top-0 bg-gray-100 py-2 z-10">
                    Served
                  </h3>
                  <div className="max-h-48 overflow-y-auto rounded-lg bg-white shadow-inner">
                    <div className="space-y-2 p-2">
                      {/* Served menu items */}
                      {orderItems
                        .filter((item) => item.status === "served")
                        .map((item) => {
                          const menuItem = menuItems.find(
                            (mi) => mi.id === item.menu_item_id
                          );
                          return (
                            <div
                              key={item.id}
                              className="flex justify-between items-center bg-gray-50 p-2 rounded"
                            >
                              <span className="text-sm md:text-base">
                                {menuItem?.name}
                              </span>
                              <span className="text-sm">x{item.quantity}</span>
                            </div>
                          );
                        })}

                      {/* Served add-ons */}
                      {orderAddOns
                        .filter((addOn) => addOn.status === "served")
                        .map((addOn) => {
                          const addOnItem = addOns.find(
                            (a) => a.id === addOn.addon_id
                          );
                          return (
                            <div
                              key={addOn.id}
                              className="flex justify-between items-center bg-gray-50 p-2 rounded"
                            >
                              <span className="text-sm md:text-base">
                                {addOnItem?.name} (Add-on)
                              </span>
                              <span className="text-sm">x{addOn.quantity}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>

          {/* Sticky Checkout Button */}
          <div className="sticky bottom-0 pt-4 bg-gray-100">
            <button
              onClick={checkout}
              className="w-full bg-red-500 shadow-md hover:shadow-xl transition-all duration-300 text-white px-4 py-2 rounded"
            >
              Proceed To Payment
            </button>
          </div>
        </div>
      </div>

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          document.body.style.pointerEvents = "auto";
        }}
        tableNumber={order.tables.table_number}
        packageName={order.packages.name}
        customerCount={order.customer_count}
        orderItems={orderItems}
        menuItems={menuItems}
        orderId={order.id}
      />
    </div>
  );
}
