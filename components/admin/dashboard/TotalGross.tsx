import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

interface IncomeData {
  yesterdayIncome: number;
  todayIncome: number;
}

interface Package {
  price: number;
}

interface AddOn {
  price: number;
}

interface OrderAddon {
  quantity: number;
  add_ons: AddOn;
}

interface OrderWithPackage {
  id: string;
  customer_count: number;
  payment_status: string;
  created_at: string;
  terminated_at: string | null;
  packages: Package;
  order_addons: OrderAddon[];
}

export function TotalGross() {
  const [incomeData, setIncomeData] = useState<IncomeData>({
    yesterdayIncome: 0,
    todayIncome: 0,
  });

  useEffect(() => {
    fetchIncomeData();

    const ordersChannel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchIncomeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const fetchIncomeData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        customer_count,
        payment_status,
        created_at,
        terminated_at,
        packages (
          price
        ),
        order_addons (
          quantity,
          add_ons (
            price
          )
        )
      `
      )
      .eq("payment_status", "paid")
      .gte("created_at", yesterday.toISOString());

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    let yesterdayIncome = 0;
    let todayIncome = 0;

    (ordersData as unknown as OrderWithPackage[]).forEach((order) => {
      const orderDate = new Date(order.terminated_at || order.created_at);
      orderDate.setHours(0, 0, 0, 0);

      // Calculate package total
      const packageTotal = order.customer_count * (order.packages?.price || 0);

      // Calculate addons total
      const addonsTotal =
        order.order_addons?.reduce((sum, addon) => {
          return sum + addon.quantity * (addon.add_ons?.price || 0);
        }, 0) || 0;

      // Combined total for this order
      const orderTotal = packageTotal + addonsTotal;

      // Check if order is from today or yesterday
      if (orderDate.getTime() === today.getTime()) {
        todayIncome += orderTotal;
      } else if (orderDate.getTime() === yesterday.getTime()) {
        yesterdayIncome += orderTotal;
      }
    });

    setIncomeData({
      yesterdayIncome,
      todayIncome,
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  return (
    <div className="flex justify-between gap-6">
      <div>
        <h3 className="font-semibold text-blue-800 ">Yesterday's Income</h3>
        <p className="font-bold text-blue-900">
          {formatCurrency(incomeData.yesterdayIncome)}
        </p>
      </div>
      <div className="">
        <h3 className="font-semibold text-green-800">Today's Income</h3>
        <p className="font-bold text-green-900">
          {formatCurrency(incomeData.todayIncome)}
        </p>
      </div>
    </div>
  );
}

export default TotalGross;
