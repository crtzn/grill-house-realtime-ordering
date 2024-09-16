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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Header from "@/components/HeaderBox";
import supabase from "@/lib/supabase";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  image: string;
}

const MenuPage: React.FC = () => {
  const [fetchError, setFetchError] = useState<any>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    image: "",
  });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase.from("menu").select();
      if (error) {
        setFetchError(error);
        setMenu([]);
      } else {
        setMenu(data);
        setFetchError(null);
      }
    };

    fetchMenu();
  }, []); // Empty dependency array means this effect runs once on mount

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMenuItem = () => {
    setMenu((prev) => [...prev, { ...newItem, id: Date.now() }]);
    setNewItem({ name: "", description: "", image: "" });
  };

  const handleEditItem = async () => {
    // Update the item in the database
    // Then update the item in the local state
  };

  const handleDeleteItem = async () => {
    // Delete the item from the database
    // Then remove the item from the local state
  };

  return (
    <div className="p-8">
      <Header title="Menu" />
      <div className="flex items-center justify-between">
        <RadioGroup>
          <div className="flex gap-3">
            <div>
              <RadioGroupItem value="main" />
              <Label htmlFor="main">Main</Label>
            </div>
            <div>
              <RadioGroupItem value="sides" />
              <Label htmlFor="sides">Sides</Label>
            </div>
            <div>
              <RadioGroupItem value="drinks" />
              <Label htmlFor="drinks">Drinks</Label>
            </div>
          </div>
        </RadioGroup>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mb-4">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[#f2f2f2]">
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newItem.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newItem.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                  Image
                </Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  onChange={handleImageUpload}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button onClick={handleAddMenuItem}>Add Item</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6"></div>
      {fetchError && <p>Error: {fetchError.message}</p>}
      {menu ? (
        <ul>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            {menu.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 bg-white shadow"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover mb-4 rounded"
                />
                <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
                <p className="text-gray-600">{item.description}</p>
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
