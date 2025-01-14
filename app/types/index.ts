// types.ts
export interface MenuItemType {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  categories?: {
    id: string;
    name: string;
  };
  image_url?: string | null;
  is_available: boolean;
}

export interface PackageItem {
  id: string;
  package_id: string;
  menu_item_id: string;
  quantity: number | null;
  is_unlimited: boolean;
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  status: "pending" | "preparing" | "served" | "cancelled";
  menuItem: MenuItemType;
}

export interface Customer {
  id: string;
  table_id: string;
  package_id: string;
  customer_count: number;
  status: "pending" | "active" | "completed" | "cancelled";
  created_at: string;
  terminated_at: string | null;
  orderItems: OrderItem[];
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
  order_items: OrderItem[];
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
export interface Category {
  id: string;
  name: string;
  description: string;
}
