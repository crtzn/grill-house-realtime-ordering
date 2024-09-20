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
import { createClient } from "@supabase/supabase-js";
import { Label } from "@/components/ui/label";

// Initialize Supabase client
const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MenuItem {
id: number;
name: string;
description: string;
}

const MenuPage: React.FC = () => {
const [fetchError, setFetchError] = useState<string | null>(null);
const [menu, setMenu] = useState<MenuItem[]>([]);
const [newItem, setNewItem] = useState<Omit<MenuItem, "id">>({
name: "",
description: "",
});
const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [isDialogOpen, setIsDialogOpen] = useState(false);

useEffect(() => {
fetchMenu();

    const channel = supabase
      .channel("menu-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Clasica" },
        handleInsert
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Clasica" },
        handleUpdate
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "Clasica" },
        handleDelete
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

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

const handleInsert = (payload: { new: MenuItem }) => {
console.log("Insert received!", payload);
setMenu((currentMenu) => [...currentMenu, payload.new]);
};

const handleUpdate = (payload: { new: MenuItem }) => {
console.log("Update received!", payload);
setMenu((currentMenu) =>
currentMenu.map((item) =>
item.id === payload.new.id ? payload.new : item
)
);
};

const handleDelete = (payload: { old: { id: number } }) => {
console.log("Delete received!", payload);
setMenu((currentMenu) =>
currentMenu.filter((item) => item.id !== payload.old.id)
);
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

const handleAddMenuItem = async () => {
try {
if (!newItem.name || !newItem.description) {
setFetchError("Please fill out all fields");
return;
}
const { data, error } = await supabase
.from("Clasica")
.insert(newItem)
.select();

      if (error) throw error;

      setNewItem({ name: "", description: "" });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding new menu item:", error);
      setFetchError(error.message);
    }

};

const handleEditItem = async () => {
if (!editingItem) return;
try {
const { error } = await supabase
.from("Clasica")
.update({
name: editingItem.name,
description: editingItem.description,
})
.eq("id", editingItem.id);

      if (error) throw error;

      setEditingItem(null);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating menu item:", error);
      setFetchError(error.message);
    }

};

const handleDeleteItem = async (id: number) => {
try {
const { error } = await supabase.from("Clasica").delete().eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error deleting menu item:", error);
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
<DialogTitle>
{editingItem ? "Edit Menu Item" : "Add New Menu Item"}
</DialogTitle>
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
value={
editingItem ? editingItem.description : newItem.description
}
onChange={handleInputChange}
className="col-span-3"
/>
</div>
</div>
<Button onClick={editingItem ? handleEditItem : handleAddMenuItem}>
{editingItem ? "Update Item" : "Add Item"}
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
<h2 className="text-xl font-semibold mb-2">{item.name}</h2>
<p className="text-gray-600">{item.description}</p>
<div className="mt-4 flex justify-end space-x-2">
<Button
variant="outline"
size="sm"
onClick={() => {
setEditingItem(item);
setIsDialogOpen(true);
}} >
<Edit className="h-4 w-4 mr-2" /> Edit
</Button>
<Button
variant="destructive"
size="sm"
onClick={() => handleDeleteItem(item.id)} >
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
