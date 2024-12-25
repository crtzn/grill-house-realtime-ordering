"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from "@/lib/supabaseClient";

export function CustomersToday() {
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    async function fetchTotalCustomers() {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("orders")
        .select("customer_count")
        .gte("created_at", today);

      if (error) {
        console.error("Error fetching customers:", error);
        return;
      }

      const total = data.reduce(
        (sum, order) => sum + (order.customer_count || 0),
        0
      );
      setTotalCustomers(total);
    }

    fetchTotalCustomers();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customers Today</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{totalCustomers}</p>
      </CardContent>
    </Card>
  );
}
