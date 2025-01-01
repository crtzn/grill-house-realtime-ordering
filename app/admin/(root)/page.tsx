import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CustomersToday } from "@/components/admin/dashboard/CustomerToday";
import { AvailableTables } from "@/components/admin/dashboard/Available";
// import { MostOrdered } from "@/components/admin/dashboard/MostOrdered";
import { CustomerChart } from "@/components/admin/dashboard/CustomerChart";
import { TotalGross } from "@/components/admin/dashboard/TotalGross";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Suspense
          fallback={
            <Card>
              <CardContent>Loading...</CardContent>
            </Card>
          }
        >
          <CustomersToday />
        </Suspense>
        <Suspense
          fallback={
            <Card>
              <CardContent>Loading...</CardContent>
            </Card>
          }
        >
          <AvailableTables />
        </Suspense>
        <Suspense
          fallback={
            <Card>
              <CardContent>Loading...</CardContent>
            </Card>
          }
        >
          {/* <MostOrdered /> */}
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense
          fallback={
            <Card>
              <CardContent>Loading...</CardContent>
            </Card>
          }
        >
          <CustomerChart />
        </Suspense>
        <Suspense
          fallback={
            <Card>
              <CardContent>Loading...</CardContent>
            </Card>
          }
        >
          <TotalGross />
        </Suspense>
      </div>
    </div>
  );
}
