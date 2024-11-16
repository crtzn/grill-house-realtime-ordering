"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Header from "@/components/HeaderBox";

const Devices = () => {
  return (
    <div>
      <Header title="Device" />
      <div className="flex justify-start items-center gap-5 mt-20">
        <Dialog>
          <div className="bg-white">
            <DialogTrigger className="bg-red-600 w-56 h-14 text-white">
              1
            </DialogTrigger>
            <DialogContent></DialogContent>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default Devices;
