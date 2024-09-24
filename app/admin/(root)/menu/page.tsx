"use client";

import React, { use, useEffect, useState } from "react";
import { PlusCircle, Edit, Trash, Radio } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/HeaderBox";
import { createClient } from "@supabase/supabase-js";
import { Label } from "@/components/ui/label";
import supabase from "@/lib/supabaseClient";
import InputForm from "@/components/menu/components/InputForm";
import SelectPackage from "@/components/menu/components/SelectPackage";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  imageSrc: string;
}

const MenuPage: React.FC = () => {
  const [image, setImage] = useState("https://placehold.co/600x400");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fetchError, setFetchError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    imageSrc: "https://placehold.co/600x400",
  });

  useEffect(() => {
    fetchMenuItems();

    const channel = supabase
      .channel("clasica")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "clasica" },
        (payload) => {
          console.log("New item added:", payload.new);
          setMenuItems((prev) => [...prev, payload.new as MenuItem]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "clasica" },
        (payload) => {
          console.log("Item deleted:", payload.old);
          setMenuItems((prev) =>
            prev.filter((item) => item.id !== payload.old.id)
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase.from("clasica").select();

    if (error) {
      setFetchError(error);
      setMenuItems([]);
    } else {
      setMenuItems(data);
      setFetchError(null);
    }
  };

  const handleAddMenuItem = async () => {
    try {
      if (!newItem.name || !newItem.description) {
        setFetchError("Please fill in all fields");
        return;
      }

      const { data, error } = await supabase
        .from("clasica")
        .insert([newItem])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setMenuItems((prev) => [...prev, data[0] as MenuItem]);
        setNewItem({ name: "", description: "", imageSrc: "" });
        setIsDialogOpen(false);
        setFetchError(null);
      }
    } catch (error: any) {
      console.error("Error adding new menu item:", error);
      setFetchError(error.message);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteMenuItem = async (id: number) => {
    // Accept 'id' as a parameter
    const { data, error } = await supabase
      .from("clasica")
      .delete()
      .eq("id", id) // Use the passed 'id' here
      .select("*");

    if (error) {
      console.log("Error deleting item:", error);
      setFetchError(error.message);
    } else {
      console.log("Deleted item:", data);
      // Optionally update the local state if needed
      setMenuItems((prev) => prev.filter((item) => item.id !== id)); // Update local state
    }
  };

  return (
    <div className="p-8">
      <Header title="Menu" />
      <div className="flex items-center justify-between">
        <div className="choose-package">
          <SelectPackage />
        </div>
        <div className="trigger-section">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Menu
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label
                    htmlFor="picture"
                    className="flex flex-col justify-center items-center cursor-pointer h-auto border-2 border-dashed border-black rounded-lg p-4"
                  >
                    {newItem.imageSrc ? (
                      <img
                        src={newItem.imageSrc}
                        alt={newItem.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <p>Add picture</p>
                      </>
                    )}
                  </Label>
                  <Input
                    id="picture"
                    type="file"
                    className="hidden"
                    // onChange={handleImageUpload}
                  />
                </div>
                <InputForm
                  label="Name"
                  id="name"
                  name="name"
                  value={editingItem ? editingItem.name : newItem.name}
                  onChange={handleInputChange}
                />
                {fetchError && (
                  <p className="text-red-500">Error: {fetchError}</p>
                )}
                <InputForm
                  id="description"
                  label="Description"
                  name="description"
                  value={
                    editingItem ? editingItem.description : newItem.description
                  }
                  onChange={handleInputChange}
                />
                <Button onClick={handleAddMenuItem}>
                  Add Item
                  {/* {editingItem ? "Update Items" : "Add Item"} */}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {menuItems ? (
        <ul>
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8 mt-6">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 bg-white shadow"
              >
                <img
                  src={image}
                  alt={item.name}
                  className="w-full h-48 object-cover mb-4 rounded"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => {
                        setEditingItem(item);
                        setIsDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button onClick={() => handleDeleteMenuItem(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ul>
      ) : (
        <p>Loading menu...</p>
      )}
    </div>
  );
};

export default MenuPage;
