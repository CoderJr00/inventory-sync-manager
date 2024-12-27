export interface Product {
  [x: string]: any;  
  tambiaCode: string | null;
  odooCode: string;
  tambiaName: string | null;
  odooName: string;
  unidadMedida: string;
  category: string;
  visible: boolean;
  fabricable: boolean;
  reservePercentage: number;
  minimum: number;
  maximum: number;
  cantidadInventario: number;
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