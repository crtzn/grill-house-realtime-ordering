import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import supabase from "@/lib/supabaseClient";

// Base type definitions
interface MenuItem {
  name: string;
}

interface Package {
  name: string;
}

// Component state types
interface MenuItemType {
  menu_item_id: string;
  total_quantity: number;
  menu_items: MenuItem;
}

interface PackageType {
  package_id: string;
  total_quantity: number;
  packages: Package;
}

// Supabase response types
interface OrderItem {
  menu_item_id: string;
  quantity: number;
  menu_items: MenuItem;
}

interface OrderPackage {
  package_id: string;
  customer_count: number;
  packages: Package;
}

const MostOrderedItems: React.FC = () => {
  const [mostOrderedMenuItem, setMostOrderedMenuItem] =
    useState<MenuItemType | null>(null);
  const [mostOrderedPackage, setMostOrderedPackage] =
    useState<PackageType | null>(null);

  useEffect(() => {
    const fetchMostOrderedData = async () => {
      try {
        // Fetch most ordered menu item
        const { data: menuItemsData, error: menuItemsError } = (await supabase
          .from("order_items")
          .select("menu_item_id, quantity, menu_items (name)")) as {
          data: OrderItem[];
          error: any;
        };

        if (menuItemsError) {
          throw menuItemsError;
        }

        // Aggregate quantities for menu items
        const aggregatedMenuItems = menuItemsData.reduce<MenuItemType[]>(
          (acc, item) => {
            const existingItem = acc.find(
              (i) => i.menu_item_id === item.menu_item_id
            );
            if (existingItem) {
              existingItem.total_quantity += item.quantity;
            } else {
              acc.push({
                menu_item_id: item.menu_item_id,
                total_quantity: item.quantity,
                menu_items: item.menu_items,
              });
            }
            return acc;
          },
          []
        );

        // Find the menu item with the highest quantity
        const mostOrderedMenu = aggregatedMenuItems.reduce((prev, current) =>
          prev.total_quantity > current.total_quantity ? prev : current
        );

        setMostOrderedMenuItem(mostOrderedMenu);

        // Fetch most ordered package
        const { data: packagesData, error: packagesError } = (await supabase
          .from("orders")
          .select("package_id, customer_count, packages (name)")) as {
          data: OrderPackage[];
          error: any;
        };

        if (packagesError) {
          throw packagesError;
        }

        // Aggregate quantities for packages
        const aggregatedPackages = packagesData.reduce<PackageType[]>(
          (acc, item) => {
            const existingItem = acc.find(
              (i) => i.package_id === item.package_id
            );
            if (existingItem) {
              existingItem.total_quantity += item.customer_count;
            } else {
              acc.push({
                package_id: item.package_id,
                total_quantity: item.customer_count,
                packages: item.packages,
              });
            }
            return acc;
          },
          []
        );

        // Find the package with the highest quantity
        const mostOrderedPkg = aggregatedPackages.reduce((prev, current) =>
          prev.total_quantity > current.total_quantity ? prev : current
        );

        setMostOrderedPackage(mostOrderedPkg);
      } catch (error) {
        console.error("Error fetching most ordered data:", error);
      }
    };

    fetchMostOrderedData();
  }, []);

  return (
    <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-gray-200">
      <CardHeader></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Most Ordered Menu Item */}
          <div>
            <h3 className="font-semibold mb-2">Most Ordered Menu Item</h3>
            {mostOrderedMenuItem ? (
              <div className="flex justify-between">
                <span>
                  {mostOrderedMenuItem.menu_items?.name || "Unknown Item"}
                </span>
                <span>{mostOrderedMenuItem.total_quantity} ordered</span>
              </div>
            ) : (
              <span>No data available</span>
            )}
          </div>

          {/* Most Ordered Package */}
          <div>
            <h3 className="font-semibold mb-2">Most Ordered Package</h3>
            {mostOrderedPackage ? (
              <div className="flex justify-between">
                <span>
                  {mostOrderedPackage.packages?.name || "Unknown Package"}
                </span>
                <span>{mostOrderedPackage.total_quantity} ordered</span>
              </div>
            ) : (
              <span>No data available</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MostOrderedItems;
