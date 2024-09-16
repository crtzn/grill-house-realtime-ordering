import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

interface DeviceDetails {
  number: number;
  // status: get status to check if active or inactive
  // quantity: get quantity of the customer per device
  // package: get package ordered by the customer
}

function DeviceStatus({ number }: DeviceDetails) {
  //   const [active, setActive] = useState(false);
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Device {number}</Button>
        </DialogTrigger>
        <DialogContent className="bg-white">
          <DialogHeader>
            <div className="flex justify-center">
              <CardContent className="border">{number}</CardContent>
            </div>
          </DialogHeader>
          <DialogDescription>
            <p>Status:</p>
            <p>Time Enter:</p>
            <p>Quantity:</p>
            <p>Package oredered:</p>
          </DialogDescription>
          <Button>Upgrade</Button>
          <Button>Terminate</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DeviceStatus;
