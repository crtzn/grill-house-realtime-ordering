import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from "@/lib/supabaseClient";

interface MenuItemType {
  menu_item_id: string;
  total_quantity: number;
  menu_items: {
    name: string;
  }[]; // Allow menu_items to be an array
}

const MostOrderedItems: React.FC = () => {
  const [mostOrderedItems, setMostOrderedItems] = useState<MenuItemType[]>([]);

  useEffect(() => {
    const fetchMostOrderedItems = async () => {
      // Fetch data from the order_items table, including the related menu_items
      const { data, error } = await supabase
        .from("order_items")
        .select("menu_item_id, quantity, menu_items (name)")
        .order("quantity", { ascending: false });

      if (error) {
        console.error("Error fetching most ordered items:", error);
        return;
      }

      // Aggregate quantities by menu_item_id
      const aggregatedData = data.reduce((acc, item) => {
        const existingItem = acc.find(
          (i) => i.menu_item_id === item.menu_item_id
        );
        if (existingItem) {
          existingItem.total_quantity += item.quantity;
        } else {
          acc.push({
            menu_item_id: item.menu_item_id,
            total_quantity: item.quantity,
            menu_items: item.menu_items, // This is now an array
          });
        }
        return acc;
      }, [] as MenuItemType[]);

      // Sort by total quantity in descending order
      aggregatedData.sort((a, b) => b.total_quantity - a.total_quantity);

      setMostOrderedItems(aggregatedData);
    };

    fetchMostOrderedItems();
  }, []);

  return (
    <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-gray-200">
      <CardHeader>
        <CardTitle>Most Ordered Items</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {mostOrderedItems.map((item) => (
            <li key={item.menu_item_id}>
              <div className="flex justify-between">
                {/* Access the first item in the menu_items array */}
                <span>{item.menu_items[0]?.name || "Unknown Item"}</span>
                <span>{item.total_quantity} ordered</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default MostOrderedItems;
