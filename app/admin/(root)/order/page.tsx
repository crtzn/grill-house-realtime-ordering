"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import NewOrderDialog from "@/components/admin/order/newOrderDialog";
import { useToast } from "@/hooks/use-toast";

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

interface OrderAddon {
  id: string;
  order_id: string;
  addon_id: string;
  quantity: number;
  status: string;
  addon_name: string;
}

export default function OrderManagement() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderAddons, setOrderAddons] = useState<OrderAddon[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchOrderItems();
    fetchOrderAddOns();

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

    const orderAddonsSubscription = supabase
      .channel("order_addons")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_addons" },
        (payload) => {
          console.log("Order addons change received!", payload);
          handleOrderAddonChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(orderItemsSubscription);
      supabase.removeChannel(orderAddonsSubscription);
    };
  }, []);

  async function fetchOrderAddons() {
    const { data, error } = await supabase
      .from("order_addons")
      .select(
        `
        id,
        order_id,
        addon_id,
        quantity,
        status,
        add_ons (
          name
        )
      `
      )
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching order addons:", error);
    } else if (data) {
      const formattedOrderAddons: OrderAddon[] = data.map((addon: any) => ({
        id: addon.id,
        order_id: addon.order_id,
        addon_id: addon.addon_id,
        quantity: addon.quantity,
        status: addon.status,
        addon_name: addon.addons?.name,
      }));
      setOrderAddons(formattedOrderAddons);
    }
  }
  const handleOrderAddonChange = async (payload: any) => {
    if (payload.eventType === "INSERT") {
      const { data: addonData, error: addonError } = await supabase
        .from("add_ons")
        .select("name")
        .eq("id", payload.new.addon_id)
        .single();

      if (addonError) {
        console.error("Error fetching addon data:", addonError);
        return;
      }

      const newOrderAddon: OrderAddon = {
        id: payload.new.id,
        order_id: payload.new.order_id,
        addon_id: payload.new.addon_id,
        quantity: payload.new.quantity,
        status: payload.new.status,
        addon_name: addonData.name,
      };

      setOrderAddons((prevAddons) => [...prevAddons, newOrderAddon]);
    } else if (payload.eventType === "UPDATE") {
      setOrderAddons((prevAddons) =>
        prevAddons.map((addon) =>
          addon.id === payload.new.id ? { ...addon, ...payload.new } : addon
        )
      );
    } else if (payload.eventType === "DELETE") {
      setOrderAddons((prevAddons) =>
        prevAddons.filter((addon) => addon.id !== payload.old.id)
      );
    }
  };

  async function fetchOrderAddOns() {
    const { data, error } = await supabase
      .from("order_addons")
      .select(
        `
      id,
      order_id,
      addon_id,
      quantity,
      status,
      add_ons (
        name
      )
    `
      )
      .order("id", { ascending: true });
    if (error) {
      console.log("Error fetching order addons:", error);
    } else if (data) {
      const formattedOrderAddons: OrderAddon[] = data.map((addon: any) => ({
        id: addon.id,
        order_id: addon.order_id,
        addon_id: addon.addon_id,
        quantity: addon.quantity,
        status: addon.status,
        addon_name: addon.addons?.name,
      }));
      setOrderAddons(formattedOrderAddons);
    }
  }

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
      toast({
        title: "Error",
        description: "Failed to update order item status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Order item status updated to ${newStatus}.`,
      });

      if (newStatus === "served") {
        const { data: remainingItems } = await supabase
          .from("order_items")
          .select("id")
          .eq("order_id", orderId)
          .neq("status", "served");

        if (remainingItems?.length === 0) {
          toast({
            title: "Order Completed",
            description: "All items have been served.",
          });
        }
      }
    }
  }

  async function updateOrderAddonStatus(
    addonId: string,
    newStatus: string,
    orderId: string
  ) {
    const { error } = await supabase
      .from("order_addons")
      .update({ status: newStatus })
      .eq("id", addonId);

    if (error) {
      console.error("Error updating order addon status:", error);
      toast({
        title: "Error",
        description: "Failed to update order addon status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Order addon status updated to ${newStatus}.`,
      });

      if (newStatus === "served") {
        const { data: remainingAddons } = await supabase
          .from("order_addons")
          .select("id")
          .eq("order_id", orderId)
          .neq("status", "served");

        if (remainingAddons?.length === 0) {
          toast({
            title: "Order Completed",
            description: "All addons have been served.",
          });
        }
      }
    }
  }

  const handleOrderChange = async (payload: any) => {
    if (payload.eventType === "INSERT") {
      // Fetch the related table data for the new order
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("table_number")
        .eq("id", payload.new.table_id)
        .single();

      if (tableError) {
        console.error("Error fetching table data:", tableError);
        return;
      }

      const newOrder: Order = {
        id: payload.new.id,
        status: payload.new.status,
        table_number: tableData.table_number,
      };

      setOrders((prevOrders) => [newOrder, ...prevOrders]);
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

  const handleOrderItemChange = async (payload: any) => {
    if (payload.eventType === "INSERT") {
      // Fetch the related menu item data for the new order item
      const { data: menuItemData, error: menuItemError } = await supabase
        .from("menu_items")
        .select("name")
        .eq("id", payload.new.menu_item_id)
        .single();

      if (menuItemError) {
        console.error("Error fetching menu item data:", menuItemError);
        return;
      }

      const newOrderItem: OrderItem = {
        id: payload.new.id,
        order_id: payload.new.order_id,
        menu_item_id: payload.new.menu_item_id,
        quantity: payload.new.quantity,
        status: payload.new.status,
        menu_item_name: menuItemData.name,
      };

      setOrderItems((prevItems) => [...prevItems, newOrderItem]);
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
          const activeAddons = orderAddons.filter(
            (addon) => addon.order_id === order.id && addon.status !== "served"
          );

          // Only hide if BOTH items and addons are empty/served
          if (activeItems.length === 0 && activeAddons.length === 0)
            return null;

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

                {activeAddons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-gray-100 rounded"
                  >
                    <div className="mb-2 sm:mb-0">
                      <span className="font-medium">{addon.addon_name}</span>
                      <span className="ml-2 text-sm text-gray-600">
                        Quantity: {addon.quantity}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        Status: {addon.status}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      {addon.status === "pending" && (
                        <button
                          onClick={() =>
                            updateOrderAddonStatus(
                              addon.id,
                              "preparing",
                              order.id
                            )
                          }
                          className="px-3 py-1 bg-yellow-500 text-white rounded mr-2"
                        >
                          Preparing
                        </button>
                      )}
                      {addon.status === "preparing" && (
                        <button
                          onClick={() =>
                            updateOrderAddonStatus(addon.id, "served", order.id)
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
