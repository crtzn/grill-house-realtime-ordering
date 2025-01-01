export interface Table {
  id: string;
  table_number: number;
  capacity: number;
  status: "available" | "occupied";
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  is_available: boolean;
  price: number;
  quantity?: number;
  is_unlimited?: boolean;
}

export interface Order {
  id: string;
  table_id: string;
  package_id: string;
  customer_count: number;
  status: "pending" | "active" | "completed" | "cancelled";
  total_price: number;
  notes?: string;
  created_at: string;
  last_updated_at: string;
  terminated_at?: string;
}

export interface OrderItem {
  menu_item_id: string;
  quantity: number;
  name: string;
  status: "pending" | "preparing" | "served" | "cancelled";
}
