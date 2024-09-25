"use client";

import React, { useState } from "react";
import Gallery from "@/components/order/Gallery";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import supabase from "@/lib/supabaseClient";

interface MenuItem {
  name: string;
  description: string;
  quantity: number;
}

// sample data
const MenuItems = [
  {
    name: "Pork Jawl",
    description: "Lorem ipsum dolor sit amet.",
    quantity: 0,
  },
  { name: "Rice", description: "Lorem ipsum dolor sit amet.", quantity: 0 },
  {
    name: "Pork Beef",
    description: "Lorem ipsum dolor sit amet.",
    quantity: 0,
  },
  {
    name: "Beef Jawl",
    description: "Lorem ipsum dolor sit amet.",
    quantity: 0,
  },
  {
    name: "Test Jawl",
    description: "Lorem ipsum dolor sit amet.",
    quantity: 0,
  },
  {
    name: "Ewan Jawl",
    description: "Lorem ipsum dolor sit amet.",
    quantity: 0,
  },
  {
    name: "Siguro Jawl",
    description: "Lorem ipsum dolor sit amet.",
    quantity: 0,
  },
];

//fetch the package_id from supabase
//showOrder, implement handlers how I pass items that order to the showOrder?
function page() {
  const [orderItems, setOrderItems] = useState<MenuItem[]>([]);
  const [quantity, setQuantity] = useState(50);

  const addToOrder = (item: MenuItem) => {
    setOrderItems((prevOrderItems) => {
      const itemExists = prevOrderItems.find(
        (orderItem) => orderItem.name === item.name
      );

      if (itemExists) {
        return prevOrderItems.map((orderItem) =>
          orderItem.name === item.name
            ? { ...orderItem, quantity: orderItem.quantity + 50 }
            : orderItem
        );
      } else {
        return [...prevOrderItems, { ...item, quantity }];
      }
    });
  };

  return (
    <div className="min-h-[100%] w-full flex">
      <div className="flex flex-col gap-5 w-full mr-5">
        <div className="flex gap-5">
          <Button>Main</Button>
          <Button>Sides</Button>
          <Button>Drinks</Button>
          <Button>Utilities</Button>
        </div>
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8 mt-6">
          {MenuItems.map((item, index) => (
            <Gallery
              key={index}
              name={item.name}
              description={item.description}
              quantity={item.quantity}
              onAddToOrder={() => addToOrder(item)}
            />
          ))}
        </div>
      </div>

      {/* so in this side nag state ako ng orderItem.. para yun ang I print. so basically
 naging array siya para once nag add ako ng item. sa sidebar na to will show the list of order fc */}
      {/* Sidebar */}
      <div className="w-96 bg-gray-200 p-5 border-1 border-gray-300 relative ">
        <h1>Order List</h1>
        <div className="grid border mt-5 gap-2 overflow-y-auto max-h-[46rem]">
          {orderItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between border bg-white p-2 w-[rem]"
            >
              <p>{item.name}</p>
              <div className="flex justify-center items-center gap-4">
                <Minus />
                <p>{item.quantity}</p>
                <Plus />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 w-full">
          <Button className="bg-green-400 w-full hover:bg-green-400">
            Order
          </Button>
        </div>
      </div>
    </div>
  );
}

export default page;

// task need to finish...
// ------- front-end side --------
// 1. need ko mag work yung once nag click si customer ng gallery item // done fuck
// will automatic appear sa sidebar // done fck
// 2. need ko mag work yung increment and decrement ng quantity //inprogress
// ----- if all goods na yung mga yan -----
// ----- back-end side --------
// next na need mag work is yung sa back-end side... lke storing the order
// of the customer to the database... so that the admin can see the order of the
// customer

// ---problem ---
// nag spam yung mga order..:>
// so need ko lagyan ng limit
