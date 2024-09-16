import React from "react";
import Header from "@/components/HeaderBox";
import { CirclePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderTable from "@/components/OrderTable";
import { NewOrderBtn } from "@/components/Modal";

type Props = {};

export default function page({}: Props) {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex justify-between">
        <Header title="Order" />
        <div className="flex gap-2">
          <div>
            <NewOrderBtn />
          </div>
          <div>
            <Button className="gap-3 cursor-click">
              <p>Order lists</p>
            </Button>
          </div>
        </div>
      </div>
      <OrderTable />
    </div>
  );
}
