import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { tableId, orderId, qrCodeId } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Call the terminate_table_session function
    const { data, error } = await supabase.rpc("terminate_table_session", {
      p_table_id: tableId,
      p_order_id: orderId,
      p_qr_code_id: qrCodeId,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error terminating table:", error);
    return NextResponse.json(
      { error: "Failed to terminate table" },
      { status: 500 }
    );
  }
}
