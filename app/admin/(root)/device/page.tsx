"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/HeaderBox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import supabase from "@/lib/supabaseClient";
import { set } from "react-hook-form";

interface DeviceStatus {
  device_id: string;
  quantity: number;
  package_order: string;
  device_name: string;
  is_active: boolean;
}

const DevicePage = () => {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);

  useEffect(() => {
    fetchDevices();
    const subscription = supabase
      .channel("device_status_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "device_table" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDevices((prev) => [...prev, payload.new as DeviceStatus]);
          } else if (payload.eventType === "DELETE") {
            setDevices((prev) =>
              prev.filter((device) => device.device_id !== payload.old.id)
            );
          } else if (payload.eventType === "UPDATE") {
            setDevices((prev) =>
              prev.map((device) =>
                device.device_id === payload.new.id
                  ? { ...device, ...payload.new }
                  : device
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, ["device_table"]);

  const fetchDevices = async () => {
    const { data, error } = await supabase.from("device_table").select();
    if (error) {
      console.error("Error fetching device:", error);
    } else {
      console.log("Device data:", data);
      setDevices(data);
    }
  };

  const handleTerminate = async (deviceId: string) => {
    // Terminate device
  };

  return (
    <div>
      <Header title="Device" />
      <div className="grid w-full grid-cols-1 gap-5 sm:gap-8 transition-all sm:grid-cols-2 xl:grid-cols-4 pt-10 lg:flex">
        {devices.map((device, index) => (
          <Dialog key={index}>
            <DialogTrigger
              className={`border shadow p-5 w-[10rem] ${
                device.is_active ? "bg-[#b2f2bb]" : "bg-[#ffc9c9]"
              }`}
            >
              {device.device_name}
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogDescription>
                <p>Status: {device.is_active ? "Available" : "Unavailable"}</p>
                <p>Current Order: {device.package_order || "None"}</p>
                <p>Quantity: {device.quantity || 0}</p>
                <p>Device ID: {device.device_id}</p>
              </DialogDescription>

              <Button className="border bg-[#b2f2bb] text-[#111111] hover:bg-[#6af87d]">
                Upgrade
              </Button>
              <Button className="border bg-[#ffc9c9] hover:bg-[#fc9090]">
                Terminate
              </Button>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
};

export default DevicePage;
