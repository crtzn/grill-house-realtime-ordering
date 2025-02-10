import supabase from "@/lib/supabaseClient";
import CustomerOrderingPage from "@/app/customer/[orderId]/CustomerOrderingPage";
import { Metadata } from "next";

export interface PageProps {
  params: {
    orderId: string;
  };
}

export default async function Page({ params }: PageProps) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `*,
      tables (table_number),
      packages (
        *,
        package_items (
          menu_items (*)
        )
      )`
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  return {
    title: `Order ${params.orderId}`,
  };
}
