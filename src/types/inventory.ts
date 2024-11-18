export interface Product {
  tambiaCode: string;
  odooCode: string;
  tambiaName: string;
  odooName: string;
  category: string;
  visible: boolean;
  reservePercentage: number;
}

export interface InventoryTemplate {
  id: string;
  name: string;
  updatedAt: string;
  products: Product[];
}

export interface InventoryData {
  odooStock: number;
  tambiaAvailable: number;
  tambiaSold: number;
  othersReserved: number;
} 