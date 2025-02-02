import { Suspense } from "react";
import { ActivityLog } from "@/components/admin/dashboard/activity-log";

function page() {
  return (
    <div>
      <Suspense fallback={<LoadingPlaceholder text="Activity Log" />}>
        <ActivityLog />
      </Suspense>
    </div>
  );
}

export default page;

function LoadingPlaceholder({ text }: { text: string }) {
  return (
    <div className="text-center text-gray-500 animate-pulse py-4">
      Loading {text}...
    </div>
  );
}
