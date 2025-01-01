import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from "@/lib/supabaseClient";

export async function MostOrdered() {
  const { data, error } = await supabase
    .from("order_items")
    .select("menu_item_id, menu_items(name), quantity")
    .order("quantity", { ascending: false })
    .limit(100); // Adjust this limit as needed

  if (error) {
    console.error("Error fetching most ordered item:", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Ordered Item</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold">Error fetching data</p>
        </CardContent>
      </Card>
    );
  }

  // Process the data to find the most ordered item
  const itemCounts = data.reduce((acc, item) => {
    const id = item.menu_item_id;
    if (!acc[id]) {
      acc[id] = { name: item.menu_items?.name, count: 0 };
    }
    acc[id].count += item.quantity;
    return acc;
  }, {} as Record<string, { name: string; count: number }>);

  const mostOrdered = Object.values(itemCounts).reduce(
    (max, item) => (item.count > max.count ? item : max),
    { name: "N/A", count: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Ordered Item</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold">{mostOrdered.name}</p>
        <p className="text-sm text-muted-foreground">
          Ordered {mostOrdered.count} times
        </p>
      </CardContent>
    </Card>
  );
}
