export type MenuItem = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: "main" | "side" | "drink";
  is_available: boolean;
};

export type Package = {
  id: string;
  name: string;
  description: string;
  type: "clasica" | "clasica_combo" | "suprema" | "suprema_combo";
};

export type PackageContent = {
  id: string;
  package_id: string;
  menu_item_id: string;
  quantity: number;
  is_unlimited: boolean;
};
