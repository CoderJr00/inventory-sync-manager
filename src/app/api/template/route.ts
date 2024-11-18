import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const template = await prisma.template.findFirst({
            where: { id: 'general' },
            include: { products: true }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        return NextResponse.json({ error: 'Error loading template' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        
        // Asegurarse de que los productos tengan la estructura correcta
        const processedProducts = data.products.map((product: any) => ({
            tambiaCode: product.tambiaCode || null,
            odooCode: product.odooCode || '',
            tambiaName: product.tambiaName || null,
            odooName: product.odooName || '',
            category: product.category || '',
            visible: product.visible || false,
            reservePercentage: product.reservePercentage || 75
        }));

        const template = await prisma.template.upsert({
            where: { 
                id: 'general' 
            },
            update: {
                globalExtraPercentage: data.globalExtraPercentage || 10,
                products: {
                    deleteMany: {},
                    create: processedProducts
                }
            },
            create: {
                id: 'general',
                name: 'Plantilla General',
                globalExtraPercentage: data.globalExtraPercentage || 10,
                products: {
                    create: processedProducts
                }
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error('Error updating template:', error);
        return NextResponse.json({ error: 'Error updating template' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        // Eliminar primero los productos relacionados
        await prisma.product.deleteMany({
            where: { templateId: 'general' }
        });

        // Luego eliminar la plantilla
        await prisma.template.delete({
            where: { id: 'general' }
        });

        return NextResponse.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        return NextResponse.json({ error: 'Error deleting template' }, { status: 500 });
    }
}