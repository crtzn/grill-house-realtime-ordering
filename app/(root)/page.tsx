import React from "react";
import Header from "@/components/HeaderBox";
import TotalCustomerBox, { CardContent } from "@/components/TotalCustomerBox";
import ActiveDeviceBox from "@/components/ActiveDeviceBox";
import Card from "@/components/TotalCustomerBox";
import Chart from "@/components/CustomerChart";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <Header
        title="Dashboard"
        label="Hi, User. Welcome back to Grill House Admin!"
      />
      <section className="grid w-full grid-cols-1 gap-5 sm:gap-8 transition-all sm:grid-cols-2 xl:grid-cols-4 pt-10 lg:flex">
        <TotalCustomerBox amount={20} description="Total Customers" />
        <CardContent>
          <section className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">10</h2>
            <p className="text-xs text-gray-500">Active Device</p>
          </section>
        </CardContent>
        <CardContent>
          <section className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">5</h2>
            <p className="text-xs text-gray-500">Inactive Device</p>
          </section>
        </CardContent>
      </section>
      <section>
        {/* Chart for Customer*/}
        <Chart />
      </section>
    </div>
  );
}
