import { InventoryTemplate } from "@/types/inventory";

export const defaultTemplate: InventoryTemplate = {
    id: "general",
    name: "Plantilla General",
    products: [],
    updatedAt: new Date().toISOString()
};

export async function fetchTemplate(): Promise<InventoryTemplate> {
    try {
        const response = await fetch('/api/template');
        if (!response.ok) throw new Error('Error fetching template');
        return await response.json();
    } catch (error) {
        console.error('Error loading template:', error);
        return defaultTemplate;
    }
}

export async function updateTemplate(template: InventoryTemplate): Promise<void> {
    try {
        const response = await fetch('/api/template', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(template),
        });
        
        if (!response.ok) throw new Error('Error updating template');
    } catch (error) {
        console.error('Error saving template:', error);
        throw error;
    }
}

export async function deleteTemplate(): Promise<void> {
    try {
        const response = await fetch('/api/template', {
            method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Error deleting template');
    } catch (error) {
        console.error('Error deleting template:', error);
        throw error;
    }
} 