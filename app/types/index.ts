// types.ts
export interface MenuItemType {
  id: string;
  name: string;
  description?: string;
  category: string;
  image_url?: string;
  is_available: boolean;
}

export interface OrderItemType {
  id: string;
  menu_item: {
    name: string;
  };
  quantity: number;
  status: "pending" | "preparing" | "served" | "cancelled";
}

export interface OrderType {
  id: string;
  table: {
    id: string;
    table_number: number;
  };
  package: {
    name: string;
  };
  customer_count: number;
  status: "pending" | "active" | "completed" | "cancelled";
  created_at: string;
  order_items: OrderItemType[];
}

export interface TableType {
  id: string;
  table_number: number;
  status: "available" | "occupied" | "inactive";
  capacity: number;
}

export interface PackageType {
  id: string;
  name: string;
}

export interface NewCustomerType {
  table_id: string;
  package_id: string;
  customer_count: string;
}
