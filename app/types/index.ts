// @/app/types.ts
export interface MenuItem {
  id?: string; // Make id optional for new items
  name: string;
  description: string;
  image_url: string;
  category: "main" | "side" | "drink";
  is_available: boolean;
}

export interface PackageType {
  id?: string; // Make id optional for new packages
  name: string;
  description: string;
  items: string[];
  is_available: boolean;
  price: number;
}
