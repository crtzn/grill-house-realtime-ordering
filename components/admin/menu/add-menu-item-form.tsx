"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import supabase from "@/lib/supabaseClient";
import imageCompression from "browser-image-compression";

interface Package {
  id: string;
  name: string;
  type: "clasica" | "clasica_combo" | "suprema" | "suprema_combo";
}

interface PackageSelection {
  packageId: string;
  quantity: number;
  isUnlimited: boolean;
}

export default function AddMenuItemForm() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    isAvailable: true,
  });
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionStatus, setCompressionStatus] = useState<string>("");
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<PackageSelection[]>(
    []
  );
  const router = useRouter();

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching packages:", error);
      } else {
        setPackages(data || []);
      }
    };

    fetchPackages();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      isAvailable: true,
    });
    setImage(null);
    setError(null);
    setCompressionStatus("");
    setSelectedPackages([]);
  };

  const compressImage = async (file: File): Promise<File> => {
    setCompressionStatus("Compressing image...");

    const options = {
      maxSizeMB: 5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setCompressionStatus(
        `Compressed: ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`
      );
      return compressedFile;
    } catch (err) {
      console.error("Compression failed:", err);
      setCompressionStatus("Compression failed");
      throw new Error("Image compression failed");
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    try {
      let imageToUse = file;

      if (file.size > MAX_FILE_SIZE) {
        imageToUse = await compressImage(file);
      } else {
        setCompressionStatus(
          `Original size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
        );
      }

      setImage(imageToUse);
      setError(null);
    } catch (err) {
      setError("Error processing image. Please try again.");
    }
  };

  const handlePackageChange = (packageId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPackages((prev) => [
        ...prev,
        { packageId, quantity: 1, isUnlimited: false },
      ]);
    } else {
      setSelectedPackages((prev) =>
        prev.filter((p) => p.packageId !== packageId)
      );
    }
  };

  const handleQuantityChange = (packageId: string, quantity: number) => {
    setSelectedPackages((prev) =>
      prev.map((p) =>
        p.packageId === packageId ? { ...p, quantity: quantity } : p
      )
    );
  };

  const handleUnlimitedChange = (packageId: string, isUnlimited: boolean) => {
    setSelectedPackages((prev) =>
      prev.map((p) =>
        p.packageId === packageId
          ? { ...p, isUnlimited, quantity: isUnlimited ? 0 : 1 }
          : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.name.trim() || !formData.category) {
        throw new Error("Name and category are required");
      }

      let imageUrl = "";

      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("menu-images")
          .upload(fileName, image);

        if (uploadError)
          throw new Error(`Image upload failed: ${uploadError.message}`);

        const {
          data: { publicUrl },
        } = supabase.storage.from("menu-images").getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { data: menuItem, error: menuError } = await supabase
        .from("menu_items")
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          image_url: imageUrl,
          is_available: formData.isAvailable,
        })
        .select()
        .single();

      if (menuError)
        throw new Error(`Failed to add menu item: ${menuError.message}`);

      if (selectedPackages.length > 0) {
        const packageContents = selectedPackages.map((pkg) => ({
          package_id: pkg.packageId,
          menu_item_id: menuItem.id,
          quantity: pkg.isUnlimited ? 0 : pkg.quantity,
          is_unlimited: pkg.isUnlimited,
        }));

        const { error: packageError } = await supabase
          .from("package_contents")
          .insert(packageContents);

        if (packageError)
          throw new Error(
            `Failed to associate packages: ${packageError.message}`
          );
      }

      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-black hover:bg-gray-800 text-white py-7 px-5 rounded-xl"
          onClick={() => resetForm()}
        >
          New Menu Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new menu item.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
              required
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
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer"
            />
            {compressionStatus && (
              <p className="text-sm text-gray-500">{compressionStatus}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAvailable"
              checked={formData.isAvailable}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isAvailable: checked as boolean,
                }))
              }
            />
            <Label htmlFor="isAvailable">Available</Label>
          </div>

          <div className="space-y-2">
            <Label>Packages</Label>
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`package-${pkg.id}`}
                  checked={selectedPackages.some((p) => p.packageId === pkg.id)}
                  onCheckedChange={(checked) =>
                    handlePackageChange(pkg.id, checked as boolean)
                  }
                />
                <Label htmlFor={`package-${pkg.id}`}>{pkg.name}</Label>
                {selectedPackages.some((p) => p.packageId === pkg.id) && (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="1"
                      value={
                        selectedPackages.find((p) => p.packageId === pkg.id)
                          ?.quantity || 1
                      }
                      onChange={(e) =>
                        handleQuantityChange(pkg.id, parseInt(e.target.value))
                      }
                      disabled={
                        selectedPackages.find((p) => p.packageId === pkg.id)
                          ?.isUnlimited
                      }
                      className="w-16"
                    />
                    <Checkbox
                      id={`unlimited-${pkg.id}`}
                      checked={
                        selectedPackages.find((p) => p.packageId === pkg.id)
                          ?.isUnlimited
                      }
                      onCheckedChange={(checked) =>
                        handleUnlimitedChange(pkg.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`unlimited-${pkg.id}`}>Unlimited</Label>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Adding..." : "Add Menu Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
