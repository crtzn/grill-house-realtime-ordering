import React from "react";
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
import { Input } from "./ui/input";

export const NewOrderBtn = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">New Order</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#f2f2f2]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          {/* Device Available */}
        </DialogHeader>
        <DialogDescription>
          <div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select Customer"></SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="test">test</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogDescription>
        <Input type="" placeholder="Max-5" />
        <div className="flex gap-4 justify-center">
          <Button>199</Button>
          <Button>299</Button>
          <Button>399</Button>
        </div>
        <Button type="submit">Create Order</Button>
      </DialogContent>
    </Dialog>
  );
};

// show the device available..
