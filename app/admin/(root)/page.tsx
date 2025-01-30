"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomersToday } from "@/components/admin/dashboard/CustomerToday";
import { AvailableTables } from "@/components/admin/dashboard/Available";
import CustomerChart from "@/components/admin/dashboard/CustomerChart";
import { TotalGross } from "@/components/admin/dashboard/TotalGross";
import MostOrderedItems from "@/components/admin/dashboard/MostOrderedMenu";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 w-full min-h-screen">
      <h1 className="text-4xl font-bold text-gray-900 mb-10 border-b pb-4">
        Seoul Meat Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Suspense fallback={<LoadingPlaceholder text="Tables" />}>
              <AvailableTables />
            </Suspense>

            <Suspense fallback={<LoadingPlaceholder text="Customers" />}>
              <CustomersToday />
            </Suspense>
            <Suspense fallback={<LoadingPlaceholder text="Ordered Items" />}>
              <MostOrderedItems />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<LoadingPlaceholder text="Total Gross" />}>
          <TotalGross />
        </Suspense>

        <Suspense fallback={<LoadingPlaceholder text="Overview" />}>
          <CustomerChart />
        </Suspense>
      </div>
    </div>
  );
}

function LoadingPlaceholder({ text }: { text: string }) {
  return (
    <div className="text-center text-gray-500 animate-pulse py-4">
      Loading {text}...
    </div>
  );
}
