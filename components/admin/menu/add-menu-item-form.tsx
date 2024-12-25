"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Swal from "sweetalert2";
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
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import supabase from "@/lib/supabaseClient";
import { MenuItemType, PackageType } from "@/app/types/index";

// Updated to match package_items table structure
interface SelectedPackageState {
  selected: boolean;
  quantity: number | null;
  isUnlimited: boolean;
}

interface AddMenuItemFormProps {
  packages: PackageType[];
  onSubmit: () => void;
}

export default function AddMenuItemForm({
  onSubmit,
}: {
  onSubmit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItem, setNewItem] = useState<Omit<MenuItemType, "id">>({
    name: "",
    description: "",
    category: "main",
    image_url: null,
    is_available: true,
  });

  const [selectedPackages, setSelectedPackages] = useState<{
    [key: string]: SelectedPackageState;
  }>({});

  const [image, setImage] = useState<File | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from("packages")
          .select("*")
          .eq("is_available", true)
          .order("name");

        if (error) throw error;

        if (data) {
          setPackages(data);
          // Initialize with proper typing
          const packagesState: { [key: string]: SelectedPackageState } = {};
          data.forEach((pkg) => {
            packagesState[pkg.id] = {
              selected: false,
              quantity: 1,
              isUnlimited: false,
            };
          });
          setSelectedPackages(packagesState);
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
        toast({
          title: "Error",
          description: "Failed to load packages. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = null;
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
          ...newItem,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (menuError) throw menuError;

      // Insert package items for selected packages
      if (menuItem) {
        const packageItemsToInsert = Object.entries(selectedPackages)
          .filter(([_, value]) => value.selected)
          .map(([packageId, value]) => ({
            package_id: packageId,
            menu_item_id: menuItem.id,
            quantity: value.isUnlimited ? null : value.quantity,
            is_unlimited: value.isUnlimited,
          }));

        if (packageItemsToInsert.length > 0) {
          const { error: packageItemsError } = await supabase
            .from("package_items")
            .insert(packageItemsToInsert);

          if (packageItemsError) throw packageItemsError;
        }
      }

      // Reset form after successful submission
      setOpen(false);
      setNewItem({
        name: "",
        description: "",
        category: "main",
        image_url: null,
        is_available: true,
      });
      setImage(null);

      // Reset packages state with proper typing
      const resetPackagesState: { [key: string]: SelectedPackageState } = {};
      packages.forEach((pkg) => {
        resetPackagesState[pkg.id] = {
          selected: false,
          quantity: 1,
          isUnlimited: false,
        };
      });
      setSelectedPackages(resetPackagesState);

      onSubmit();
      router.refresh();
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Menu item added successfully",
      });
    } catch (error) {
      console.error("Error adding menu item:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add menu item!",
      });
    }
  };

  const updatePackageSelection = (
    packageId: string,
    updates: Partial<SelectedPackageState>
  ) => {
    setSelectedPackages((prev) => ({
      ...prev,
      [packageId]: {
        ...prev[packageId],
        ...updates,
      },
    }));
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
              value={newItem.description || ""}
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
                setNewItem({ ...newItem, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="main">Main</SelectItem>
                <SelectItem value="side">Side</SelectItem>
                <SelectItem value="drink">Drink</SelectItem>
                <SelectItem value="addsOn">Adds On</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assign to Packages</Label>
            {isLoading ? (
              <div>Loading packages...</div>
            ) : packages.length === 0 ? (
              <div>No packages available</div>
            ) : (
              packages.map((pkg) => (
                <div key={pkg.id} className="space-y-2 border p-3 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`package-${pkg.id}`}
                      checked={selectedPackages[pkg.id]?.selected}
                      onCheckedChange={(checked) => {
                        updatePackageSelection(pkg.id, {
                          selected: checked as boolean,
                        });
                      }}
                    />
                    <Label htmlFor={`package-${pkg.id}`}>{pkg.name}</Label>
                  </div>
                  {selectedPackages[pkg.id]?.selected && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedPackages[pkg.id]?.isUnlimited}
                          onCheckedChange={(checked) => {
                            updatePackageSelection(pkg.id, {
                              isUnlimited: checked as boolean,
                              quantity: checked ? null : 1,
                            });
                          }}
                        />
                        <Label>Unlimited</Label>
                      </div>
                      {!selectedPackages[pkg.id]?.isUnlimited && (
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={selectedPackages[pkg.id]?.quantity ?? 1}
                            onChange={(e) => {
                              updatePackageSelection(pkg.id, {
                                quantity: parseInt(e.target.value),
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <Button type="submit" className="w-full">
            Add Item
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
