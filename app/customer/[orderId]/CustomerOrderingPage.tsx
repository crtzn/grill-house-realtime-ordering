"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import DigitalReceiptModal from "@/app/customer/[orderId]/DigitalReceipt";
import { Category } from "@/app/types";
import Swal from "sweetalert2";
import { useToast } from "@/hooks/use-toast";

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
  }, [order.id]);

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

          const { data, error } = await supabase
            .from("order_items")
            .delete()
            .eq("order_id", order.id);

          // Delete order add-ons
          const { error: addOnsError } = await supabase
            .from("order_addons")
            .delete()
            .eq("order_id", order.id);

          if (orderError || addOnsError) {
            throw orderError || addOnsError;
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
  const getDisplayItems = () => {
    if (showingAddOns) {
      return addOns
        .filter((addOn) => addOn.is_available)
        .map((addOn) => ({
          id: addOn.id,
          name: addOn.name,
          description: `₱${addOn.price.toFixed(2)}`,
          is_available: addOn.is_available,
          image_url: "/api/placeholder/400/320", // Use a placeholder image for add-ons
        }));
    }

    return selectedCategory
      ? menuItems.filter((item) => item.categories?.id === selectedCategory)
      : menuItems;
  };

  const pendingItemsCount = orderItems.filter(
    (item) => item.status === "pending"
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
        <div className="mb-4 overflow-x-auto whitespace-nowrap pb-2">
          <div className="inline-flex space-x-2">
            <Button
              onClick={() => {
                setSelectedCategory(null);
                setShowingAddOns(false);
              }}
              className={`${
                selectedCategory === null &&
                !showingAddOns &&
                selectedCategory === null &&
                !showingAddOns
                  ? "bg-[#383838] text-white"
                  : "bg-[#242424] text-white"
              } px-4 py-2 hover:bg-[#383838] hover:text-white`}
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
                } px-4 py-2 hover:bg-[#383838] hover:text-white`}
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
              } px-4 py-2 hover:bg-[#383838] hover:text-white`}
            >
              Add-ons
            </Button>
          </div>
        </div>

        {/* Display Grid - Shows either menu items or add-ons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getDisplayItems().map((item) => (
            <div key={item.id} className="border p-4 rounded">
              <div className="relative w-full pt-[75%]">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="absolute top-0 left-0 w-full h-full object-cover rounded"
                />
              </div>
              <div>
                <h3 className="font-bold mt-2">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              {showingAddOns ? (
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
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="bg-white px-2 py-1">
                      {orderItems.find((oi) => oi.menu_item_id === item.id)
                        ?.quantity || 0}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => addToOrder(item)}
                    className={`mt-2 px-4 py-2 rounded w-full ${
                      !item.is_available
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : orderItems.some(
                            (oi) =>
                              oi.menu_item_id === item.id &&
                              oi.status === "pending" &&
                              oi.quantity >= MAX_ITEMS_PER_MENU_ITEM
                          )
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                    disabled={
                      !item.is_available ||
                      orderItems.some(
                        (oi) =>
                          oi.menu_item_id === item.id &&
                          oi.status === "pending" &&
                          oi.quantity >= MAX_ITEMS_PER_MENU_ITEM
                      )
                    }
                  >
                    {!item.is_available
                      ? "Unavailable"
                      : orderItems.some(
                          (oi) =>
                            oi.menu_item_id === item.id &&
                            oi.status === "pending" &&
                            oi.quantity >= MAX_ITEMS_PER_MENU_ITEM
                        )
                      ? "Max Limit Reached"
                      : "Add to Order"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div
        className={`w-full md:w-1/4 bg-gray-100 p-4 overflow-y-auto fixed md:static inset-0 z-40 transform transition-transform duration-300 ease-in-out ${
          showCart ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <button
          onClick={() => setShowCart(false)}
          className="md:hidden absolute top-4 right-4 text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">Your Order</h2>
        {["confirming", "pending", "preparing", "served"].map((stage) => (
          <div key={stage} className="mb-4">
            <h3 className="font-bold capitalize mb-2">{stage}</h3>

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
                    className="flex flex-wrap justify-between items-center mb-2 bg-white p-2 rounded"
                  >
                    <span className="w-full sm:w-auto mb-2 sm:mb-0">
                      {menuItem?.name}
                    </span>
                    {stage === "confirming" || stage === "pending" ? (
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
                        {stage === "confirming" && (
                          <button
                            onClick={() => confirmOrderItem(item.id)}
                            className="ml-2 bg-blue-500 text-white px-2 py-1 rounded"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    ) : (
                      <span>x {item.quantity}</span>
                    )}
                  </div>
                );
              })}

            {/* Add-ons */}
            {orderAddOns
              .filter((addOn) => addOn.status === stage)
              .map((addOn) => {
                const addOnItem = addOns.find((a) => a.id === addOn.addon_id);
                return (
                  <div
                    key={addOn.id}
                    className="flex flex-wrap justify-between items-center mb-2 bg-white p-2 rounded"
                  >
                    <span className="w-full sm:w-auto mb-2 sm:mb-0">
                      {addOnItem?.name} (Add-on)
                    </span>
                    {stage === "confirming" || stage === "pending" ? (
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
                        <span className="bg-white px-2 py-1">
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
                        <button
                          onClick={() => removeOrderAddOn(addOn.id)}
                          className="ml-2 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {stage === "confirming" && (
                          <button
                            onClick={() => confirmOrderAddOn(addOn.id)}
                            className="ml-2 bg-blue-500 text-white px-2 py-1 rounded"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    ) : (
                      <span>x {addOn.quantity}</span>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
        <button
          onClick={checkout}
          className="w-full bg-red-500 shadow-md hover:shadow-xl transition-all duration-300 text-white px-4 py-2 rounded mt-4"
        >
          Proceed To Payment
        </button>
      </div>

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        tableNumber={order.tables.table_number}
        packageName={order.packages.name}
        customerCount={order.customer_count}
        totalPrice={order.total_price}
        orderItems={orderItems}
        menuItems={menuItems}
      />
    </div>
  );
}
