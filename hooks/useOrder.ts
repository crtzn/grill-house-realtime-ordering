import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Order } from "@/app/types/types";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          package:packages(*),
          order_addons:order_addons(
            *,
            addon:addons(*)
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching orders:", error);
      } else {
        setOrders(data || []);
      }
      setIsLoading(false);
    }

    fetchOrders();
  }, [supabase]); // Added supabase to the dependency array

  return { orders, isLoading };
}
