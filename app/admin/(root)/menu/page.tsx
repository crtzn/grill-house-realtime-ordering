"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/HeaderBox";
import { Label } from "@/components/ui/label";
import supabase from "@/lib/supabaseClient";
import InputForm from "@/components/menu/components/InputForm";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  imageSrc: string;
}

const MenuPage: React.FC = () => {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
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
        { event: "*", schema: "public", table: "clasica" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMenuItems((prev) => [...prev, payload.new as MenuItem]);
          } else if (payload.eventType === "DELETE") {
            setMenuItems((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          } else if (payload.eventType === "UPDATE") {
            setMenuItems((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? { ...item, ...payload.new } : item
              )
            );
          }
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
      setFetchError(error.message);
      setMenuItems([]);
    } else {
      setMenuItems(data);
      setFetchError(null);
    }
    setIsLoading(false);
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
        setNewItem({
          name: "",
          description: "",
          imageSrc: "https://placehold.co/600x400",
        });
        setIsDialogOpen(false);
        setFetchError(null);
      }
    } catch (error: any) {
      console.error("Error adding new menu item:", error);
      setFetchError(error.message);
    }
  };

  const handleUpdateMenuItem = async () => {
    if (!editingItem) return;

    try {
      const { data, error } = await supabase
        .from("clasica")
        .update({
          name: editingItem.name,
          description: editingItem.description,
          imageSrc: editingItem.imageSrc,
        })
        .eq("id", editingItem.id)
        .select();

      if (error) throw error;

      setEditingItem(null);
      setIsDialogOpen(false);
      setFetchError(null);
    } catch (error: any) {
      console.error("Error updating menu item:", error);
      setFetchError(error.message);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (editingItem) {
      setEditingItem({ ...editingItem, [name]: value });
    } else {
      setNewItem((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    const { error } = await supabase.from("clasica").delete().eq("id", id);

    if (error) {
      console.log("Error deleting item:", error);
      setFetchError(error.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("menu-images")
        .upload(fileName, file);

      if (error) {
        console.error("Error uploading image:", error);
        setFetchError(error.message);
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("menu-images").getPublicUrl(fileName);

        if (editingItem) {
          setEditingItem({ ...editingItem, imageSrc: publicUrl });
        } else {
          setNewItem((prev) => ({ ...prev, imageSrc: publicUrl }));
        }
      }
    }
  };

  return (
    <div className="p-8">
      <Header title="Menu" />
      <div className="flex items-center justify-between">
        <div className="choose-package">
          <p>Select Package here</p>
        </div>
        <div className="trigger-section">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setNewItem({
                    name: "",
                    description: "",
                    imageSrc: "https://placehold.co/600x400",
                  });
                }}
              >
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
                    <img
                      src={
                        editingItem ? editingItem.imageSrc : newItem.imageSrc
                      }
                      alt={editingItem ? editingItem.name : newItem.name}
                      className="h-full w-full object-cover"
                    />
                  </Label>
                  <Input
                    id="picture"
                    type="file"
                    className="hidden"
                    onChange={handleImageUpload}
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
                <Button
                  onClick={
                    editingItem ? handleUpdateMenuItem : handleAddMenuItem
                  }
                >
                  {editingItem ? "Update Item" : "Add Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p>Loading menu...</p>
      ) : (
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8 mt-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 bg-white shadow"
            >
              <img
                src={item.imageSrc}
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
      )}
    </div>
  );
};

export default MenuPage;
