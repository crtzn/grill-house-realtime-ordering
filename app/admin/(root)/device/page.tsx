"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import supabase from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";
import { Trash, Edit } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  status: "available" | "occupied" | "inactive";
}

interface Order {
  id: string;
  package_id: string;
  package_name: string;
  customer_count: number;
  status: "pending" | "active" | "completed" | "cancelled";
  total_price: number;
}

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
}

export default function TableManagement() {
  const { toast } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [newTable, setNewTable] = useState({ table_number: "", capacity: "" });
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    fetchTables();
    fetchPackages();

    const tablesChannel = supabase
      .channel("tables")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        () => fetchTables()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tablesChannel);
    };
  }, []);

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .order("table_number", { ascending: true });

    if (error) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tables. Please try again.",
        variant: "destructive",
      });
    } else if (data) {
      setTables(data);
    }
  };

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("price", { ascending: true });

    if (error) {
      console.error("Error fetching packages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch packages. Please try again.",
        variant: "destructive",
      });
    } else if (data) {
      setPackages(data);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", tableId);

      if (error) throw error;

      Swal.fire({
        title: "Success",
        text: "Table has been deleted successfully.",
        icon: "success",
      });

      fetchTables();
    } catch (error) {
      console.error("Error deleting table:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to delete table. Please try again.",
        icon: "error",
      });
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("tables")
      .insert({
        table_number: parseInt(newTable.table_number),
        capacity: parseInt(newTable.capacity),
        status: "available",
      })
      .select();

    if (error) {
      console.error("Error adding table:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while adding the table.",
      });
    } else {
      setNewTable({ table_number: "", capacity: "" });
      setIsAddingTable(false);
      fetchTables();
      Swal.fire({
        title: "Success",
        text: "Table added successfully.",
        icon: "success",
      });
    }
  };

  const handleTableClick = async (table: Table) => {
    setSelectedTable(table);
    console.log("Fetching order for table:", table.id);
    if (table.status === "occupied") {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("table_id", table.id)
        .eq("status", "active")
        .single();

      if (error) {
        console.error("Error fetching order:", error);
        toast({
          title: "Error",
          description: "Failed to fetch order details. Please try again.",
          variant: "destructive",
        });
      } else if (data) {
        setCurrentOrder(data);
      }
    } else {
      setCurrentOrder(null);
    }
  };

  const handleTerminateTable = async () => {
    if (!selectedTable || !currentOrder) return;

    try {
      // Complete the order
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "completed",
          terminated_at: new Date().toISOString(),
        })
        .eq("id", currentOrder.id);

      if (orderError) throw orderError;

      // Update table status
      const { error: tableError } = await supabase
        .from("tables")
        .update({ status: "available" })
        .eq("id", selectedTable.id);

      if (tableError) throw tableError;

      // Delete QR code
      const { error: qrDeleteError } = await supabase
        .from("qr_codes")
        .delete()
        .eq("order_id", currentOrder.id);

      if (qrDeleteError) {
        console.error("Error deleting QR code:", qrDeleteError);
        Swal.fire({
          title: "Error",
          text: "Failed to delete QR code. Please try again.",
          icon: "error",
        });
      }

      setSelectedTable(null);
      setCurrentOrder(null);
      fetchTables();

      Swal.fire({
        title: "Success",
        text: "Table has been terminated and QR code deleted.",
        icon: "success",
      });
    } catch (error) {
      console.error("Error terminating table:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to terminate table. Please try again.",
        icon: "error",
      });
    }
  };

  const handleEditTable = (table: Table) => {
    setEditingTable(table);
    setIsEditingTable(true);
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    try {
      const { error } = await supabase
        .from("tables")
        .update({ capacity: editingTable.capacity })
        .eq("id", editingTable.id);

      if (error) throw error;

      setIsEditingTable(false);
      setEditingTable(null);
      fetchTables();

      Swal.fire({
        title: "Success",
        text: "Table has been updated successfully.",
        icon: "success",
      });
    } catch (error) {
      console.error("Error updating table:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update table. Please try again.",
        icon: "error",
      });
    }
  };

  const handleUpgradePackage = async (packageId: string) => {
    if (!selectedTable || !currentOrder) return;

    try {
      const selectedPackage = packages.find((pkg) => pkg.id === packageId);
      if (!selectedPackage) throw new Error("Package not found");

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          package_id: packageId,
          total_price: selectedPackage.price * currentOrder.customer_count,
        })
        .eq("id", currentOrder.id);

      if (orderError) throw orderError;

      setSelectedTable(null);
      setCurrentOrder(null);
      fetchTables();

      Swal.fire({
        title: "Success",
        text: "Package has been upgraded successfully.",
        icon: "success",
      });
    } catch (error) {
      console.error("Error upgrading package:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to upgrade package. Please try again.",
        icon: "error",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Table Management</h1>
        <Dialog open={isAddingTable} onOpenChange={setIsAddingTable}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-[#242424] hover:text-white py-7 px-7 rounded-xl hover:drop-shadow-xl">
              Add New Table
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <Label htmlFor="table_number">Table Number</Label>
                <Input
                  id="table_number"
                  type="number"
                  value={newTable.table_number}
                  onChange={(e) =>
                    setNewTable({ ...newTable, table_number: e.target.value })
                  }
                  min="1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={newTable.capacity}
                  onChange={(e) =>
                    setNewTable({ ...newTable, capacity: e.target.value })
                  }
                  min="1"
                  required
                />
              </div>
              <Button
                type="submit"
                className="bg-black text-white hover:bg-[#242424] hover:text-white"
              >
                Add Table
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => (
          <Card
            key={table.id}
            className={`cursor-pointer ${
              table.status === "available"
                ? "bg-green-100"
                : table.status === "occupied"
                ? "bg-red-100"
                : "bg-gray-100"
            }`}
            onClick={() => handleTableClick(table)}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Table {table.table_number}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    className="bg-blue-600 hover:bg-blue-400 px-3 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTable(table);
                    }}
                  >
                    <Edit stroke="white" width={20} />
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-400 px-3 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTable(table.id);
                    }}
                  >
                    <Trash stroke="white" width={20} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p>Capacity: {table.capacity}</p>
              <p>Status: {table.status}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {selectedTable && currentOrder && (
        <Dialog
          open={!!selectedTable}
          onOpenChange={() => setSelectedTable(null)}
        >
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>
                Table {selectedTable.table_number} Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p>Status: {selectedTable.status}</p>
              <p>Capacity: {selectedTable.capacity}</p>
              <p>Customers: {currentOrder.customer_count}</p>
              <p>Order Status: {currentOrder.status}</p>
              <p>Current Package: {currentOrder.package_name}</p>

              <Button
                onClick={handleTerminateTable}
                className="bg-red-600 text-white hover:bg-red-700 hover:text-white"
              >
                End Session
              </Button>
              <Select onValueChange={handleUpgradePackage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Upgrade Package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} - ₱{pkg.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={isEditingTable} onOpenChange={setIsEditingTable}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTable} className="space-y-4">
            <div>
              <Label htmlFor="edit_table_number">Table Number</Label>
              <Input
                id="edit_table_number"
                type="number"
                value={editingTable?.table_number || ""}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="edit_capacity">Capacity</Label>
              <Input
                id="edit_capacity"
                type="number"
                value={editingTable?.capacity || ""}
                onChange={(e) =>
                  setEditingTable((prev) =>
                    prev
                      ? { ...prev, capacity: parseInt(e.target.value) }
                      : null
                  )
                }
                min="1"
                required
              />
            </div>
            <Button
              type="submit"
              className="bg-black text-white hover:bg-[#242424] hover:text-white"
            >
              Update Table
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
