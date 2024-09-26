"use client";

import React from "react";
import Header from "@/components/HeaderBox";
import OrderTable from "@/components/OrderTable";

const OrderPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex justify-between">
        <Header title="Order" />
      </div>
      <OrderTable />
    </div>
  );
};

export default OrderPage;

{
  /* <NewOrderBtn /> */
}
