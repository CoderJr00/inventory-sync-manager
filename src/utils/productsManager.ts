import { Product } from "@/types/inventory";

export const defaultProduct: Product = {
    odooCode: "",
    odooName: "",
    tambiaCode: "",
    tambiaName: "",
    unidadMedida: "Unidades",
    reservePercentage: 75,
    category: "",
    visible: false,
    fabricable: false,
    minimum: 0,
    maximum: 0,
    cantidadInventario: 10.5
};

export async function fetchProducts(): Promise<Product[]> {
    try {
        const response = await fetch('/api/products');
        console.log(response.status);
        if (!response.ok) throw new Error('Error fetching products');
        return await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        return [defaultProduct];
    }
}

export async function createProduct(product: Product): Promise<Response> {
    if (!product.odooCode) {
        product.odooCode = "0";
    }
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(product),
        });
        console.log(response);
        if (!response.ok) throw new Error('Error creating product');
        return response;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

export async function updateProduct(id: string, product: Product): Promise<void> {
    try {
        const response = await fetch(`/api/products?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(product),
        });

        if (!response.ok) throw new Error('Error updating product');
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

export async function deleteProduct(id: string): Promise<void> {
    try {
        const response = await fetch(`/api/products?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Error deleting product');
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
} 