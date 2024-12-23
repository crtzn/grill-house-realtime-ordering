import React from "react";
import Header from "@/components/HeaderBox";
import TotalCustomerBox, { CardContent } from "@/components/TotalCustomerBox";
import ActiveDeviceBox from "@/components/ActiveDeviceBox";
import Card from "@/components/TotalCustomerBox";
import CustomerChart from "@/components/CustomerChart";
import AddNewOrder from "@/components/admin/order/NewOrderBtn";
import { Button } from "@/components/ui/button";
import { Bell, Bolt } from "lucide-react";
import TotalSales from "@/components/TotalSale";
import AddingNewCustomer from "@/components/admin/order/NewOrderBtn";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex justify-between items-center">
        <div className="w-full">
          <Header
            title="Dashboard"
            label="Hi, User. Welcome back to Grill House Admin!"
          />
        </div>
        <div className="flex w-full justify-end gap-5 items-center align-middle">
          <Bell width={35} height={50} />
          <Bolt width={35} height={50} />
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 sm:gap-8 transition-all sm:grid-cols-2 xl:grid-cols-4 pt-10 lg:flex">
        <TotalCustomerBox amount={20} description="Total Customers Today" />
        <CardContent>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">10</h2>
            <p className="text-xs text-gray-500">Active Device</p>
          </div>
        </CardContent>
        <CardContent>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">Most order</h2>
            <p className="text-xs text-gray-500"></p>
          </div>
        </CardContent>
      </div>
      <div className="flex gap-5">
        {/* Chart for Customer*/}
        <CustomerChart />
        <TotalSales />
      </div>
    </div>
  );
}
