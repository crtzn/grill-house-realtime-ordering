import React from "react";
import Header from "@/components/HeaderBox";
import { CirclePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderTable from "@/components/OrderTable";
import { NewOrderBtn } from "@/components/order/Modal";

interface OrderPackage {
  clasica: number;
  Suprema: number;
  UCM: number; //Unlimited Combo Meals
  SC: number; //Supreme Combo
}

export default function page() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex justify-between">
        <Header title="Order" />
        <NewOrderBtn />
      </div>
      <OrderTable />
    </div>
  );
}
