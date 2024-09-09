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

export const NewOrderBtn = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">New Order</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          {/* Device Available */}
        </DialogHeader>
        <Button type="submit">Create Order</Button>
      </DialogContent>
    </Dialog>
  );
};
