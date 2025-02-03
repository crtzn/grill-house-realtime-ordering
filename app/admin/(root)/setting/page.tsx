"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import supabase from "@/lib/supabaseClient";

interface AdminUser {
  id: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
}

export default function AdminSettingsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = async () => {
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, email, password, role, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setUsers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      if (editingUser) {
        formData.append("id", editingUser.id);
        await updateAdminUser(formData);
      } else {
        await createAdminUser(formData);
      }
      setIsOpen(false);
      setEditingUser(null);
      await refreshUsers();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this admin user?")) {
      try {
        await deleteAdminUser(id);
        await refreshUsers();
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const createAdminUser = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    if (!["admin", "staff", "kitchen"].includes(role)) {
      throw new Error("Invalid role");
    }

    const { error } = await supabase
      .from("admin_users")
      .insert([{ email, password, role }]);

    if (error) throw error;
  };

  const updateAdminUser = async (formData: FormData) => {
    const id = formData.get("id") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    if (!["admin", "staff", "kitchen"].includes(role)) {
      throw new Error("Invalid role");
    }

    const { error } = await supabase
      .from("admin_users")
      .update({ email, password, role })
      .eq("id", id);

    if (error) throw error;
  };

  const deleteAdminUser = async (id: string) => {
    const { error } = await supabase.from("admin_users").delete().eq("id", id);
    if (error) throw error;
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      <div className="flex justify-end mb-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditingUser(null)}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Add Admin User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit Admin User" : "Add Admin User"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingUser?.email}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  defaultValue={editingUser?.password}
                  required={!editingUser}
                />
              </div>
              <div>
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <Select name="role" defaultValue={editingUser?.role || "admin"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                {editingUser ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.password}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingUser(user);
                    setIsOpen(true);
                  }}
                  className="border-blue-600 hover:drop-shadow-lg"
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(user.id)}
                  className="border-red-600 hover:drop-shadow-lg"
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
