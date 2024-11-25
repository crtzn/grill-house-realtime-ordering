"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MenuItemType, PackageType } from "@/app/types";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import supabase from "@/lib/supabaseClient";

interface AddMenuItemFormProps {
  packages: PackageType[];
  onSubmit: () => void;
}

export default function AddMenuItemForm({
  packages,
  onSubmit,
}: AddMenuItemFormProps) {
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState<Omit<MenuItemType, "id">>({
    name: "",
    description: "",
    category: "main",
    image_url: "",
    is_available: true,
  });
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1); // Quantity state
  const [isUnlimited, setIsUnlimited] = useState(false); // Unlimited state
  const [image, setImage] = useState<File | null>(null);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = "";
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("menu-images")
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("menu-images").getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Insert new menu item
      const { data: menuItem, error: menuError } = await supabase
        .from("menu_items")
        .insert({
          name: newItem.name,
          description: newItem.description,
          category: newItem.category,
          image_url: imageUrl,
          is_available: newItem.is_available,
        })
        .select()
        .single();

      if (menuError) throw menuError;

      // Check if menu item was created successfully
      if (menuItem && selectedPackages.length > 0) {
        // Insert into package_items instead of package_contents
        const packageItems = selectedPackages.map((packageId) => ({
          menu_item_id: menuItem.id, // New menu item ID
          package_id: packageId,
          quantity: isUnlimited ? null : quantity, // If unlimited, no quantity
          is_unlimited: isUnlimited,
        }));

        const { error: packageError } = await supabase
          .from("package_items") // Change to package_items table
          .insert(packageItems);

        if (packageError) throw packageError;
      }

      setOpen(false);
      setNewItem({
        name: "",
        description: "",
        category: "main",
        image_url: "",
        is_available: true,
      });
      setSelectedPackages([]);
      setImage(null);
      setQuantity(1);
      setIsUnlimited(false);
      onSubmit();
      router.refresh();
      toast({
        title: "Success",
        description: "Menu item added successfully",
      });
    } catch (error) {
      console.error("Error adding menu item:", error);
      toast({
        title: "Error",
        description: "Failed to add menu item. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-gray-800 text-white py-7 px-5 rounded-xl">
          New Menu Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={newItem.category}
              onValueChange={(value) =>
                setNewItem({
                  ...newItem,
                  category: value as MenuItemType["category"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="main">Main</SelectItem>
                <SelectItem value="side">Side</SelectItem>
                <SelectItem value="drink">Drink</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assign to Packages</Label>
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`package-${pkg.id}`}
                  checked={selectedPackages.includes(pkg.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPackages([...selectedPackages, pkg.id]);
                    } else {
                      setSelectedPackages(
                        selectedPackages.filter((id) => id !== pkg.id)
                      );
                    }
                  }}
                />
                <Label htmlFor={`package-${pkg.id}`}>{pkg.name}</Label>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              disabled={isUnlimited}
            />
            <div className="flex items-center">
              <Checkbox
                checked={isUnlimited}
                onCheckedChange={() => setIsUnlimited(!isUnlimited)}
              />
              <Label>Unlimited</Label>
            </div>
          </div>
          <Button type="submit" className="w-full">
            Add Item
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
