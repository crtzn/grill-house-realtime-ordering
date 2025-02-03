import { Suspense } from "react";
import { getAdminUsers } from "@/app/admin/(root)/setting/action";
import { AdminUsersTable } from "@/app/admin/(root)/setting/admin-user-table";

export default async function AdminSettingsPage() {
  const initialUsers = await getAdminUsers();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <AdminUsersTable initialUsers={initialUsers} />
      </Suspense>
    </div>
  );
}
