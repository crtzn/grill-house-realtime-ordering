"use client";

import React, { useState, useRef, useEffect } from "react";
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
import { MenuItemType, Category } from "@/app/types";
import Swal from "sweetalert2";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";
import { Description } from "@radix-ui/react-toast";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [editedItem, setEditedItem] = useState<MenuItemType>(item);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    item.image_url || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.log("Error fetch data:", error);
    }
  };

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

  //the error is here can`t find the yung category column wala na kasi ako nun, dapat yung ma update
  //is yung category_id so yeah I will fix this later.
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

      // const updatedItem = { ...editedItem, image_url: updatedImageUrl };

      const updatedItem = {
        name: editedItem.name,
        desciption: editedItem.description,
        category_id: editedItem.category_id,
        image_url: updatedImageUrl,
        is_available: editedItem.is_available,
      };

      const { data, error } = await supabase
        .from("menu_items")
        .update(updatedItem)
        .eq("id", editedItem.id)
        .select()
        .single();

      if (error) throw error;

      onSubmit(data as MenuItemType);
      onClose();

      await toast({
        title: "Success",
        description: "Menu item updated successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error updating menu item:", error);

      await toast({
        title: "Error",
        description: "An error occurred while updating the menu item",
        duration: 2000,
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
              value={editedItem.category_id}
              onValueChange={(value) =>
                setEditedItem({
                  ...editedItem,
                  category_id: value as MenuItemType["category_id"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
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
