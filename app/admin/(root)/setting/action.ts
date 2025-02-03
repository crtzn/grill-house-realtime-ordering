"use server";
import supabase from "@/lib/supabaseClient";

export async function getAdminUsers() {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, password, role, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createAdminUser(formData: FormData) {
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
  return { message: "Admin user created successfully" };
}

export async function updateAdminUser(formData: FormData) {
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
  return { message: "Admin user updated successfully" };
}

export async function deleteAdminUser(id: string) {
  const { error } = await supabase.from("admin_users").delete().eq("id", id);

  if (error) throw error;
  return { message: "Admin user deleted successfully" };
}
