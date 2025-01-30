"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, PackageOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/lib/supabaseClient";
import AddPackageForm from "./add-packages";
import { MenuItemType } from "@/app/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface PackageManagementModalProps {
  menuItems: MenuItemType[];
  onSubmit: () => void;
}

interface PackageItem {
  id: string;
  menu_item_id: string;
  package_id: string;
  menu_item?: {
    name: string;
    description?: string;
    image_url?: string;
  };
}

interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  package_items?: PackageItem[];
}

const PackageManagementModal: React.FC<PackageManagementModalProps> = ({
  menuItems,
  onSubmit,
}) => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageItemsModalOpen, setIsManageItemsModalOpen] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isMainModalOpen) {
      fetchPackages();
    }
  }, [isMainModalOpen]);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const { data: packagesData, error: packagesError } = await supabase
        .from("packages")
        .select("*");

      if (packagesError) throw packagesError;

      const packagesWithItems = await Promise.all(
        packagesData.map(async (pkg) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from("package_items")
            .select(
              `
              id,
              menu_item_id,
              package_id,
              menu_items (
                id,
                name,
                description,
                image_url,
                is_available
              )
            `
            )
            .eq("package_id", pkg.id);

          if (itemsError) throw itemsError;

          return {
            ...pkg,
            package_items: itemsData.map((item) => ({
              ...item,
              menu_item: item.menu_items,
            })),
          };
        })
      );

      setPackages(packagesWithItems);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch packages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!editingPackage || !selectedMenuItem) return;

    try {
      // Find the selected menu item details
      const menuItem = menuItems.find((item) => item.id === selectedMenuItem);

      if (!menuItem) {
        toast({
          title: "Error",
          description: "Selected menu item not found",
          variant: "destructive",
        });
        return;
      }

      // Check if menu item already exists in package
      const existingItem = editingPackage.package_items?.find(
        (item) => item.menu_item_id === selectedMenuItem
      );

      if (existingItem) {
        toast({
          title: "Warning",
          description: "This menu item is already in the package",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("package_items").insert({
        package_id: editingPackage.id,
        menu_item_id: selectedMenuItem,
      });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      await fetchPackages();
      setSelectedMenuItem("");
      toast({
        title: "Success",
        description: "Menu item added to package successfully",
      });
    } catch (error) {
      console.error("Error adding menu item:", error);
      toast({
        title: "Error",
        description: "Failed to add menu item to package. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAvailableMenuItems = () => {
    if (!editingPackage) return menuItems;

    const assignedItemIds = new Set(
      editingPackage.package_items?.map((item) => item.menu_item_id)
    );
    return menuItems.filter((item) => !assignedItemIds.has(item.id));
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      // Check if package has any items
      const { data: packageItems, error: checkError } = await supabase
        .from("package_items")
        .select("id")
        .eq("package_id", packageId);

      if (checkError) throw checkError;

      if (packageItems && packageItems.length > 0) {
        toast({
          title: "Cannot Delete Package",
          description:
            "Please remove all items from the package before deleting it.",
          variant: "destructive",
        });
        return;
      }

      // If no items, proceed with deletion
      const { error: deleteError } = await supabase
        .from("packages")
        .delete()
        .eq("id", packageId);

      if (deleteError) throw deleteError;

      await fetchPackages();
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting package:", error);
      toast({
        title: "Error",
        description: "Failed to delete package. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    try {
      const { error } = await supabase
        .from("packages")
        .update({
          name: editingPackage.name,
          price: editingPackage.price,
          description: editingPackage.description,
          is_available: editingPackage.is_available,
        })
        .eq("id", editingPackage.id);

      if (error) throw error;

      await fetchPackages();
      setIsEditModalOpen(false);
      setEditingPackage(null);
      toast({
        title: "Success",
        description: "Package updated successfully",
      });
    } catch (error) {
      console.error("Error updating package:", error);
      toast({
        title: "Error",
        description: "Failed to update package",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMenuItem = async (packageId: string, itemId: string) => {
    try {
      const { error } = await supabase
        .from("package_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      await fetchPackages();
      toast({
        title: "Success",
        description: "Menu item removed from package",
      });
    } catch (error) {
      console.error("Error removing menu item:", error);
      toast({
        title: "Error",
        description: "Failed to remove menu item",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isMainModalOpen} onOpenChange={setIsMainModalOpen}>
        <DialogTrigger asChild>
          <Button className="bg-black hover:bg-gray-800 text-white py-7 px-5 rounded-xl">
            <PackageOpen className="w-4 h-4 mr-2" />
            Manage Packages
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex justify-between items-center">
              <span>Package Management</span>
              {/* Add Package Modal */}

              <AddPackageForm
                menuItems={menuItems}
                onSubmit={() => {
                  fetchPackages();
                  setIsAddModalOpen(false);
                }}
              />
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="bg-white shadow-md">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{pkg.name}</h3>
                        <p className="text-gray-600">₱{pkg.price.toFixed(2)}</p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            pkg.is_available
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pkg.is_available ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPackage(pkg);
                            setIsManageItemsModalOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Manage Items
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPackage(pkg);
                            setIsEditModalOpen(true);
                          }}
                          className="bg-gray-800 hover:bg-gray-700 text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePackage(pkg.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Included Items:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {pkg.package_items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                {item.menu_item?.name}
                              </p>
                              <p className="text-sm text-gray-600 truncate">
                                {item.menu_item?.description}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveMenuItem(pkg.id, item.id)
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Package Modal */}
      {/* <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <AddPackageForm
            menuItems={menuItems}
            onSubmit={() => {
              fetchPackages();
              setIsAddModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog> */}

      {/* Edit Package Modal */}
      {editingPackage && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Edit Package</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditPackage} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingPackage.name}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editingPackage.price}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      price: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Availability</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingPackage.is_available}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        is_available: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                  <span>Available</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Manage Menu Items Modal */}
      {editingPackage && (
        <Dialog
          open={isManageItemsModalOpen}
          onOpenChange={setIsManageItemsModalOpen}
        >
          <DialogContent className="sm:max-w-[600px] bg-white">
            <DialogHeader>
              <DialogTitle>
                Manage Menu Items - {editingPackage.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Select
                  value={selectedMenuItem}
                  onValueChange={setSelectedMenuItem}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select menu item to add" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {getAvailableMenuItems().map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                        className="py-2"
                      >
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddMenuItem}
                  disabled={!selectedMenuItem}
                  className="bg-black hover:bg-gray-800 text-white px-4"
                >
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Current Items:</h4>
                <ScrollArea className="h-[300px] w-full">
                  {editingPackage.package_items &&
                  editingPackage.package_items.length > 0 ? (
                    <div className="space-y-2">
                      {editingPackage.package_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.menu_item?.name || "Unnamed Item"}
                            </p>
                            {item.menu_item?.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {item.menu_item.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleRemoveMenuItem(editingPackage.id, item.id)
                            }
                            className="ml-4 bg-red-600 hover:bg-red-700 text-white h-8 px-3"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No items added to this package yet
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PackageManagementModal;
