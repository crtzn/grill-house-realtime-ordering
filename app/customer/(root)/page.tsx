import React from "react";
import Gallery from "@/components/order/Gallery";
import Footer from "@/components/order/Footer";

const data = [
  { name: "Pork Jawl", description: "Lorem ipsum dolor sit amet." },
  { name: "Rice", description: "Lorem ipsum dolor sit amet." },
  { name: "Pork Beef", description: "Lorem ipsum dolor sit amet." },
  { name: "Beef Jawl", description: "Lorem ipsum dolor sit amet." },
  { name: "Test Jawl", description: "Lorem ipsum dolor sit amet." },
  { name: "Ewan Jawl", description: "Lorem ipsum dolor sit amet." },
  { name: "Siguro Jawl", description: "Lorem ipsum dolor sit amet." },
];

function page() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div>//header here</div>
      <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8 mt-6">
        {data.map((item, index) => (
          <Gallery
            key={index}
            name={item.name}
            description={item.description}
          />
        ))}
      </div>
    </div>
  );
}

export default page;
