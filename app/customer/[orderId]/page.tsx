import supabase from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import CustomerOrderingPage from "@/app/customer/[orderId]/CustomerOrderingPage";

export default async function Page({
  params,
}: {
  params: { orderId: string };
}) {
  // Fetch order details
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      *,
      tables (table_number),
      packages (
        *,
        package_items (
          menu_items (*)
        )
      )
    `
    )
    .eq("id", params.orderId)
    .single();

  if (orderError) {
    console.error("Error fetching order:", orderError);
    return <div>Error loading order. Please try again.</div>;
  }

  if (!order) {
    return <div>Order not found.</div>;
  }

  return <CustomerOrderingPage initialOrder={order} />;
}
