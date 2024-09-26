"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import supabase from "@/lib/supabaseClient";

interface DeviceStatus {
  device_id: string;
  quantity: number;
  package_order: string;
  device_name: string;
  is_active: boolean;
}

export const NewOrderBtn = () => {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);

  const fetchDevices = async () => {
    const { data, error } = await supabase.from("device_table").select();
    if (error) {
      console.error("Error fetching device:", error);
    } else {
      console.log("Device data:", data);
      setDevices(data);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">New Order</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[40rem] bg-[#f2f2f2]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          {/* Device Available */}
        </DialogHeader>
        <DialogDescription>
          <div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose Table Available"></SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="test">test</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogDescription>
        <Input type="" placeholder="Max-5" />
        <div className="flex gap-4 justify-center">
          <Button>Clasica</Button>
          <Button>Clasica Combo</Button>
          <Button>Suprema</Button>
          <Button>Suprema Combo</Button>
        </div>
        <Button type="submit">Create Order</Button>
      </DialogContent>
    </Dialog>
  );
};

// show the device available..
