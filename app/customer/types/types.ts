export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  is_available: boolean;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  status: "pending" | "preparing" | "served" | "cancelled";
}

export interface Order {
  id: string;
  table_id: string;
  status: "pending" | "active" | "completed" | "cancelled";
  items: OrderItem[];
}
