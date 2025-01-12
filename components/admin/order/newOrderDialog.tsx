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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/lib/supabaseClient";
import { QRCodeSVG } from "qrcode.react";

interface Table {
  id: string;
  table_number: number;
  status: "available" | "occupied" | "inactive";
  capacity: number;
}

interface Package {
  id: string;
  name: string;
}

interface NewOrderDialogProps {
  onOrderCreated: () => void;
}

export default function NewOrderDialog({
  onOrderCreated,
}: NewOrderDialogProps) {
  const { toast } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [newCustomer, setNewCustomer] = useState({
    table_id: "",
    package_id: "",
    customer_count: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    fetchTables();
    fetchPackages();
  }, []);

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .eq("status", "available");
    if (error) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available tables. Please try again.",
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
      .eq("is_available", true);
    if (error) {
      console.error("Error fetching packages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available packages. Please try again.",
        variant: "destructive",
      });
    } else if (data) {
      setPackages(data);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_id: newCustomer.table_id,
        package_id: newCustomer.package_id,
        customer_count: parseInt(newCustomer.customer_count),
        status: "active",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const qrCodeUrl = `${process.env.NEXT_PUBLIC_CUSTOMER_URL}/customer/${orderData.id}`;

    const { data: qrCodeData, error: qrCodeError } = await supabase
      .from("qr_codes")
      .insert({
        order_id: orderData.id,
        code: qrCodeUrl,
      })
      .select()
      .single();

    if (qrCodeError) {
      console.error("Error creating QR code:", qrCodeError);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
      return;
    }

    await supabase
      .from("tables")
      .update({ status: "occupied" })
      .eq("id", newCustomer.table_id);

    setQrCode(qrCodeData.code);
    setNewCustomer({ table_id: "", package_id: "", customer_count: "" });
    fetchTables();
    onOrderCreated();
    toast({
      title: "Customer Added",
      description: "New customer has been added successfully.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black px-7 py-7 rounded-xl text-white hover:bg-[#242424] hover:text-white">
          Add New Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        {!qrCode ? (
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div>
              <Label htmlFor="table">Table</Label>
              <Select
                value={newCustomer.table_id}
                onValueChange={(value) =>
                  setNewCustomer({ ...newCustomer, table_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.table_number} (Capacity: {table.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="package">Package</Label>
              <Select
                value={newCustomer.package_id}
                onValueChange={(value) =>
                  setNewCustomer({ ...newCustomer, package_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer_count">Number of Customers</Label>
              <Input
                id="customer_count"
                type="number"
                value={newCustomer.customer_count}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    customer_count: e.target.value,
                  })
                }
                min="1"
                required
              />
            </div>
            <Button type="submit">Add Customer</Button>
          </form>
        ) : (
          <div className="space-y-4">
            <QRCodeSVG value={qrCode} size={200} />
            <p className="text-sm text-gray-500">
              Scan this QR code to access the order
            </p>
            <Button
              onClick={() => {
                const svgString = new XMLSerializer().serializeToString(
                  document.querySelector("svg")!
                );
                const blob = new Blob([svgString], {
                  type: "image/svg+xml;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "qrcode.svg";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="w-full"
            >
              Download QR Code
            </Button>
            <Button onClick={() => setIsOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
