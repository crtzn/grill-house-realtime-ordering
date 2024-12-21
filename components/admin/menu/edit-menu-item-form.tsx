"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MenuItemType } from "@/app/types";
import Swal from "sweetalert2";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";

interface EditMenuItemFormProps {
  item: MenuItemType;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updatedItem: MenuItemType) => void;
}

export default function EditMenuItemForm({
  item,
  isOpen,
  onClose,
  onSubmit,
}: EditMenuItemFormProps) {
  const [editedItem, setEditedItem] = useState<MenuItemType>(item);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    item.image_url || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExt}`;
    const filePath = `menu-items/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("menu-images")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    Swal.fire({
      title: "Updating...",
      text: "Please wait while we update the menu item",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      let updatedImageUrl = editedItem.image_url;

      if (imageFile) {
        updatedImageUrl = await uploadImage(imageFile);
      }

      const updatedItem = { ...editedItem, image_url: updatedImageUrl };

      const { data, error } = await supabase
        .from("menu_items")
        .update(updatedItem)
        .eq("id", updatedItem.id)
        .select()
        .single();

      if (error) throw error;

      onSubmit(data as MenuItemType);
      onClose();

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Menu item updated successfully",
        showConfirmButton: false,
        timer: 1500,
        customClass: {
          popup: "animated fadeInDown",
        },
      });
    } catch (error) {
      console.error("Error updating menu item:", error);

      await Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update menu item. Please try again.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton:
            "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded",
        },
      });
    }
  };

  const handleFormClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleFormClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={editedItem.name}
              onChange={(e) =>
                setEditedItem({ ...editedItem, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedItem.description}
              onChange={(e) =>
                setEditedItem({ ...editedItem, description: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={editedItem.category}
              onValueChange={(value) =>
                setEditedItem({
                  ...editedItem,
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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_available"
              checked={editedItem.is_available}
              onCheckedChange={(checked) =>
                setEditedItem({
                  ...editedItem,
                  is_available: checked as boolean,
                })
              }
            />
            <Label htmlFor="is_available">Available</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <div className="flex items-center space-x-4">
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="Menu item preview"
                  width={100}
                  height={100}
                  className="object-cover rounded"
                />
              )}
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? "Change Image" : "Upload Image"}
              </Button>
            </div>
          </div>
          <Button type="submit">Update Menu Item</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
