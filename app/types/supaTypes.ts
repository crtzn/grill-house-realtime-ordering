export type DashboardStats = {
  totalCustomers: number;
  activeTables: { status: string; count: number }[];
  mostOrdered: { name: string; count: number }[];
  totalGross: number;
  customerTrends: { month: string; count: number }[];
};

export type Tables = {
  id: string;
  table_number: number;
  capacity: number;
  status: "available" | "occupied";
};

export type Orders = {
  id: string;
  total_price: number;
  created_at: string;
  status: "pending" | "active" | "completed" | "cancelled";
};
