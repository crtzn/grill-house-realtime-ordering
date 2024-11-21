"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PackageType, MenuItem } from "@/app/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Label } from "@/components/ui/label";

interface AddPackageFormProps {
  onSubmit: (newPackage: Omit<PackageType, "id">) => void;
  menuItems: MenuItem[];
}

export default function AddPackageForm({
  onSubmit,
  menuItems,
}: AddPackageFormProps) {
  const [open, setOpen] = useState(false);
  const [newPackage, setNewPackage] = useState<Omit<PackageType, "id">>({
    name: "",
    description: "",
    items: [],
    is_available: true,
    price: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(newPackage);
    setOpen(false);
    setNewPackage({
      name: "",
      description: "",
      items: [],
      is_available: true,
      price: 0,
    });
  };

  const handleItemToggle = (itemId: string) => {
    setNewPackage((prev) => ({
      ...prev,
      items: prev.items.includes(itemId)
        ? prev.items.filter((id) => id !== itemId)
        : [...prev.items, itemId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        asChild
        className="bg-black hover:bg-gray-800 text-white py-7 px-5 rounded-xl"
      >
        <Button>Add New Package</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Add New Package</DialogTitle>
          <DialogDescription>
            Create a new package by filling out the information below.
          </DialogDescription>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newPackage.description}
              onChange={(e) =>
                setNewPackage({ ...newPackage, description: e.target.value })
              }
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
            <Select>
              <SelectTrigger>Menu Items</SelectTrigger>
              {menuItems.map((item) => (
                <SelectContent>
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.id}
                      checked={newPackage.items.includes(item.id || "")}
                      onCheckedChange={() =>
                        item.id && handleItemToggle(item.id)
                      }
                    />
                    <Label htmlFor={item.id}>{item.name}</Label>
                  </div>
                </SelectContent>
              ))}
            </Select>
          </div>
          <Button type="submit">Add Package</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
