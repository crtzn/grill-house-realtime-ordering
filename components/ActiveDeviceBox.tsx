import React from "react";
import { CardContent } from "@/components/TotalCustomerBox";

type Active = {
  active: number;
  inactive: number;
};

export default function ActiveDeviceBox({ active, inactive }: Active) {
  return (
    <div className="">
      <CardContent>
        <p>Active Status: {active}</p>
        <hr />
        <p className="text-xs text-gray-500">Device Status</p>
      </CardContent>
      <CardContent>
        <p>Inactive Status: {inactive}</p>
        <hr />
        <p className="text-xs text-gray-500">Device Status</p>
      </CardContent>
    </div>
  );
}
