"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from "@/lib/supabaseClient";

export async function TotalGross() {
  const { data } = await supabase.from("orders").select("total_price");

  const totalGross =
    data?.reduce((sum, order) => sum + parseFloat(order.total_price), 0) ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Gross Income</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">${totalGross.toFixed(2)}</p>
      </CardContent>
    </Card>
  );
}
