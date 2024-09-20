"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Edit, Trash } from "lucide-react";
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
import supabase from "@/lib/supabase";
import { Label } from "@/components/ui/label";

interface MenuItem {
id: number;
name: string;
description: string;
image: string;
}

const MenuPage: React.FC = () => {
const [fetchError, setFetchError] = useState<string | null>(null);
const [menu, setMenu] = useState<MenuItem[]>([]);
const [newItem, setNewItem] = useState({
name: "",
description: "",
image: "",
});
const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [isDialogOpen, setIsDialogOpen] = useState(false);

useEffect(() => {
fetchMenu();
}, []);

const fetchMenu = async () => {
setIsLoading(true);
const { data, error } = await supabase.from("Clasica").select();
if (error) {
setFetchError(error.message);
setMenu([]);
} else {
setMenu(data);
setFetchError(null);
}
setIsLoading(false);
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

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
if (file) {
const fileExt = file.name.split('.').pop();
const fileName = `${Math.random()}.${fileExt}`;
const { data, error } = await supabase.storage
.from('menu-images')
.upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName);

        if (editingItem) {
          setEditingItem({ ...editingItem, image: publicUrl });
        } else {
          setNewItem((prev) => ({ ...prev, image: publicUrl }));
        }
      }
    }

};

const handleAddMenuItem = async () => {
try {
if (!newItem.name || !newItem.description) {
setFetchError("Please fill out all fields");
return;
}
const { data, error } = await supabase
.from('Clasica')
.insert(newItem)
.select();

      if (error) throw error;

      setMenu(prevMenu => [...prevMenu, data[0]]);
      setNewItem({ name: "", description: "", image: "" });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding new menu item:', error);
      setFetchError(error.message);
    }

};

const handleEditItem = async () => {
if (!editingItem) return;
try {
const { data, error } = await supabase
.from('Clasica')
.update(editingItem)
.eq('id', editingItem.id)
.select();

      if (error) throw error;

      setMenu(prevMenu => prevMenu.map(item =>
        item.id === editingItem.id ? data[0] : item
      ));
      setEditingItem(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating menu item:', error);
      setFetchError(error.message);
    }

};

const handleDeleteItem = async (id: number) => {
try {
const { error } = await supabase
.from('Clasica')
.delete()
.eq('id', id);

      if (error) throw error;

      setMenu(prevMenu => prevMenu.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting menu item:', error);
      setFetchError(error.message);
    }

};

return (
<div className="p-8">
<Header title="Menu" />
<div className="flex items-center justify-between">
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
<DialogTrigger asChild>
<Button className="mb-4" onClick={() => setEditingItem(null)}>
<PlusCircle className="mr-2 h-4 w-4" /> Add New Menu Item
</Button>
</DialogTrigger>
<DialogContent className="sm:max-w-[425px] bg-[#f2f2f2]">
<DialogHeader>
<DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
</DialogHeader>
<div className="grid gap-4 py-4">
<div className="grid grid-cols-4 items-center gap-4">
<Label htmlFor="name" className="text-right">
Name
</Label>
<Input
id="name"
name="name"
value={editingItem ? editingItem.name : newItem.name}
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
value={editingItem ? editingItem.description : newItem.description}
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
<Button onClick={editingItem ? handleEditItem : handleAddMenuItem}>
{editingItem ? 'Update Item' : 'Add Item'}
</Button>
</DialogContent>
</Dialog>
</div>
{fetchError && <p className="text-red-500">Error: {fetchError}</p>}
{isLoading ? (
<p>Loading menu...</p>
) : (
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
<div className="mt-4 flex justify-end space-x-2">
<Button variant="outline" size="sm" onClick={() => {
setEditingItem(item);
setIsDialogOpen(true);
}}>
<Edit className="h-4 w-4 mr-2" /> Edit
</Button>
<Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id)}>
<Trash className="h-4 w-4 mr-2" /> Delete
</Button>
</div>
</div>
))}
</div>
)}
</div>
);
};

export default MenuPage;
