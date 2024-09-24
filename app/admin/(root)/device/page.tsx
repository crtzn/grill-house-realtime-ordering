import React, { useState } from "react";
import Header from "@/components/HeaderBox";
import DeviceStatus from "@/components/DeviceStatus";
import supabase from "@/lib/supabaseClient";

interface Device {
  id: number;
  name: string;
  isAvailable: boolean;
}

const Device = () => {
  // const [devices, setDevices] = useState([]);
  // const [loading, setLoading] = useState(true);

  // const FetchDevices = async () => {
  //   setLoading(true);
  // };

  return (
    <div>
      <Header title="Device" />
      <div className="grid w-full grid-cols-1 gap-5 sm:gap-8 transition-all sm:grid-cols-2 xl:grid-cols-4 pt-10 lg:flex">
        <DeviceStatus number={1} />
        <DeviceStatus number={2} />
        <DeviceStatus number={3} />
        <DeviceStatus number={4} />
        <DeviceStatus number={5} />
        <DeviceStatus number={6} />
      </div>
    </div>
  );
};

export default Device;
