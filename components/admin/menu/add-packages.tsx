"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { MenuItemType } from "@/app/types";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import supabase from "@/lib/supabaseClient";
import Swal from "sweetalert2";

interface AddPackageFormProps {
  menuItems: MenuItemType[];
  onSubmit: () => void;
}

export default function AddPackageForm({
  menuItems,
  onSubmit,
}: AddPackageFormProps) {
  const [open, setOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: "",
    price: 0,
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: packageData, error: packageError } = await supabase
        .from("packages")
        .insert({
          name: newPackage.name,
          price: newPackage.price,
          is_available: true,
        })
        .select()
        .single();

      if (packageError) throw packageError;

      if (packageData) {
        const packageItems = selectedItems.map((itemId) => ({
          package_id: packageData.id,
          menu_item_id: itemId,
        }));

        const { error: itemsError } = await supabase
          .from("package_items")
          .insert(packageItems);

        if (itemsError) throw itemsError;

        setOpen(false);
        setNewPackage({ name: "", price: 0 });
        setSelectedItems([]);
        onSubmit();
        router.refresh();
        Swal.fire({
          title: "Success",
          text: "Package added successfully.",
          icon: "success",
        });
      }
    } catch (error) {
      console.error("Error adding package:", error);
      Swal.fire({
        title: "Error",
        text: "An error occurred while adding the package.",
        icon: "error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-gray-800 text-white py-7 px-5 rounded-xl">
          Add New Package
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Add New Package</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newPackage.name}
              onChange={(e) =>
                setNewPackage({ ...newPackage, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={newPackage.price}
              onChange={(e) =>
                setNewPackage({
                  ...newPackage,
                  price: parseFloat(e.target.value),
                })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menuItems">Menu Items</Label>
            <Select
              onValueChange={(value) =>
                setSelectedItems([...selectedItems, value])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select menu items" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {menuItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedItems.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Items</Label>
              <ul className="list-disc pl-5">
                {selectedItems.map((itemId) => (
                  <li key={itemId}>
                    {menuItems.find((item) => item.id === itemId)?.name}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedItems(
                          selectedItems.filter((id) => id !== itemId)
                        )
                      }
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button type="submit">Add Package</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
