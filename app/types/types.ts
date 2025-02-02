export interface Addon {
  id: number;
  name: string;
  price: number;
}

export interface Package {
  id: number;
  name: string;
  price: number;
}

export interface OrderAddon {
  id: number;
  quantity: number;
  addon: Addon;
}

export interface Order {
  id: number;
  table_number: number;
  customer_count: number;
  created_at: string;
  package: Package;
  order_addons: OrderAddon[];
}
