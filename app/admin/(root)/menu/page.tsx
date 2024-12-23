"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/HeaderBox";
import supabase from "@/lib/supabaseClient";
import AddMenuItemForm from "@/components/admin/menu/add-menu-item-form";
import AddPackageForm from "@/components/admin/menu/add-packages";
import EditMenuItemForm from "@/components/admin/menu/edit-menu-item-form";
import { MenuItemType, PackageType } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import Swal from "sweetalert2";
import { set } from "react-hook-form";

type Category = "main" | "side" | "drink" | "all";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [newItem, setNewItem] = useState<MenuItemType>();

  const fetchMenuitems = async () => {
    try {
      const { data, error } = await supabase.from("menu_items").select("*");
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.log("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch menu data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuitems();
  });

  async function handleDeleteMenuItem(id: string) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#3085d6",
      cancelButtonText: "Cancel",
      cancelButtonColor: "#d33",
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) {
        Swal.fire(
          "Error",
          "Failed to delete menu item. Please try again.",
          "error"
        );
      } else {
        Swal.fire("Deleted!", "Menu item has been deleted.", "success");
      }
    }
  }

  async function handleEditMenuItem(item: MenuItemType) {
    setEditingItem(item);
  }

  async function handleUpdateMenuitem(updatedMenuItem: MenuItemType | null) {
    if (!updatedMenuItem) {
      setEditingItem(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .update({
          name: updatedMenuItem.name,
          description: updatedMenuItem.description,
          category: updatedMenuItem.category,
          image_url: updatedMenuItem.image_url,
          is_available: updatedMenuItem.is_available,
        })
        .eq("id", updatedMenuItem.id)
        .select();

      if (error) throw error;

      if (data?.[0]) {
        setMenuItems(
          menuItems.map((item) =>
            item.id === updatedMenuItem.id ? (data[0] as MenuItemType) : item
          )
        );
        setEditingItem(null);
        toast({
          title: "Success",
          description: "Menu item updated successfully",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error updating menu item:", error);
      toast({
        title: "Error",
        description: "Failed to update menu item. Please try again.",
        variant: "destructive",
      });
    }
  }

  const filteredMenuItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-8">
          <div>
            <Header title="Menu Management" />
            <p className="mt-2 text-gray-600">
              Manage your restaurant's menu items and packages
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <AddMenuItemForm packages={packages} onSubmit={fetchMenuitems} />
            <AddPackageForm menuItems={menuItems} onSubmit={fetchMenuitems} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:it ems-center gap-4 mb-8">
          <div className="w-full sm:w-auto">
            <Select
              value={selectedCategory}
              onValueChange={(value: Category) => setSelectedCategory(value)}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-white">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="main">Main Dishes</SelectItem>
                <SelectItem value="side">Side Dishes</SelectItem>
                <SelectItem value="drink">Drinks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Menu Items</h2>
            <span className="text-sm text-gray-500">
              {filteredMenuItems.length} items
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader className="h-20 bg-gray-200" />
                  <CardContent className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-40 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenuItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden bg-white hover:shadow-lg transition-shadow duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {item.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </p>

                    {item.image_url && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-md">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          layout="fill"
                          sizes=""
                          objectFit="cover"
                          className="transition-transform duration-200 hover:scale-105"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-700">
                          {item.category}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${
                            item.is_available
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.is_available ? "Available" : "Unavailable"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMenuItem(item)}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-5 py-5 hover:text-white"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white py-5 px-5"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && filteredMenuItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No menu items found.</p>
            </div>
          )}
        </div>
      </div>

      {editingItem && (
        <EditMenuItemForm
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={handleUpdateMenuitem}
        />
      )}
    </div>
  );
}
