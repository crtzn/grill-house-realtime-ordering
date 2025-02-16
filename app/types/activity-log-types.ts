export interface Package {
  id: number;
  name: string;
  price: number;
}

export interface AddOn {
  id: number;
  name: string;
  price: number;
}

export interface OrderAddon {
  id: number;
  order_id: number;
  add_on_id: number;
  quantity: number;
  status: string;
  add_on: AddOn;
}

export interface Order {
  id: number;
  table_id: number;
  package_id: number;
  customer_count: number;
  payment_status: string;
  status: string;
  created_at: string;
  package: Package;
  order_addons: OrderAddon[];
  table: {
    table_number: number;
  };
}

export interface Table {
  id: any;
  table_number: number;
  status: string;
  capacity: number;
}
