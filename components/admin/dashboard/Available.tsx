"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from "@/lib/supabaseClient";

export function AvailableTables() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { count } = await supabase
        .from("tables")
        .select("id", { count: "exact", head: true })
        .eq("status", "available");
      setCount(count);
    }
    fetchData();
  }, []);

  return (
    <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-gray-200">
      <CardHeader>
        <CardTitle>Available Tables</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{count ?? 0}</p>
      </CardContent>
    </Card>
  );
}
