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
import { toast } from "@/components/ui/use-toast";

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  status: "available" | "occupied" | "inactive";
}

interface Order {
  id: string;
  package: {
    name: string;
  };
  customer_count: number;
  status: "pending" | "active" | "completed" | "cancelled";
}

export default function TableManagement() {
  const [tables, setTables] = useState<Table[]>([]);
  const [newTable, setNewTable] = useState({ table_number: "", capacity: "" });
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchTables();

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

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("tables")
      .insert({
        table_number: parseInt(newTable.table_number),
        capacity: parseInt(newTable.capacity),
        status: "available",
      })
      .select();

    if (error) {
      console.error("Error adding table:", error);
      toast({
        title: "Error",
        description: "Failed to add table. Please try again.",
        variant: "destructive",
      });
    } else {
      setNewTable({ table_number: "", capacity: "" });
      setIsAddingTable(false);
      fetchTables();
      toast({
        title: "Table Added",
        description: "New table has been added successfully.",
      });
    }
  };

  const handleDeleteTable = async (table: Table) => {
    return;
  };

  const handleTableClick = async (table: Table) => {
    setSelectedTable(table);
    if (table.status === "occupied") {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
            id,
            package:packages (name),
            customer_count,
            status
          `
        )
        .eq("table_id", table.id)
        .eq("status", "active")
        .single();

      if (error) {
        console.error("Error fetching current order:", error);
        toast({
          title: "Error",
          description: "Failed to fetch current order. Please try again.",
          variant: "destructive",
        });
      } else if (data) {
        setCurrentOrder({
          ...data,
          package: data.package[0],
        });
      }
    } else {
      setCurrentOrder(null);
    }
  };

  const handleTerminateTable = async () => {
    if (!selectedTable || !currentOrder) return;

    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: "completed", terminated_at: new Date().toISOString() })
      .eq("id", currentOrder.id);

    if (orderError) {
      console.error("Error completing order:", orderError);
      toast({
        title: "Error",
        description: "Failed to complete order. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const { error: tableError } = await supabase
      .from("tables")
      .update({ status: "available" })
      .eq("id", selectedTable.id);

    if (tableError) {
      console.error("Error updating table status:", tableError);
      toast({
        title: "Error",
        description: "Failed to update table status. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const { error: qrCodeError } = await supabase
      .from("qr_codes")
      .update({ expired_at: new Date().toISOString() })
      .eq("order_id", currentOrder.id);

    if (qrCodeError) {
      console.error("Error expiring QR code:", qrCodeError);
      toast({
        title: "Warning",
        description: "Failed to expire QR code, but table was terminated.",
      });
    }

    setSelectedTable(null);
    setCurrentOrder(null);
    fetchTables();
    toast({
      title: "Table Terminated",
      description: "Table has been terminated and is now available.",
    });
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
              <CardTitle>Table {table.table_number}</CardTitle>
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
              <p>Package: {currentOrder.package.name}</p>
              <p>Customers: {currentOrder.customer_count}</p>
              <p>Order Status: {currentOrder.status}</p>
              <Button
                onClick={handleTerminateTable}
                className="bg-red-600 text-white hover:bg-red-700 hover:text-white"
              >
                End Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
