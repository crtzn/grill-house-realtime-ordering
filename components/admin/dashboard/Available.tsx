"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from "@/lib/supabaseClient";

export async function AvailableTables() {
  const { count } = await supabase
    .from("tables")
    .select("id", { count: "exact", head: true })
    .eq("status", "available");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Tables</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{count ?? 0}</p>
      </CardContent>
    </Card>
  );
}
