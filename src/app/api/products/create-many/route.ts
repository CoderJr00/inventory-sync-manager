import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Product } from '@/types/inventory';

export async function POST(request: Request) {
    try {
        const products: Product[] = await request.json();

        // Validar que products sea un array y no esté vacío
        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json(
                { error: 'Invalid or empty products array' },
                { status: 400 }
            );
        }

        // Limpiar y validar los datos antes de insertarlos
        const cleanedProducts = products.map(product => ({
            odooCode: product.odooCode || '',
            odooName: product.odooName || '',
            unidadMedida: product.unidadMedida || '',
            category: product.category || '',
            minimum: Number(product.minimum) || 0,
            maximum: Number(product.maximum) || 0,
            cantidadInventario: Number(product.cantidadInventario) || 0,
            fabricable: Boolean(product.fabricable),
            reservePercentage: Number(product.reservePercentage) || 75,
            tambiaCode: product.tambiaCode || null,
            tambiaName: product.tambiaName || null,
            visible: Boolean(product.visible),
        }));

        // Crear los productos
        const result = await prisma.product.createMany({
            data: cleanedProducts,
            skipDuplicates: true,
        });

        console.log('Products created:', result);

        return NextResponse.json({
            message: 'Products created successfully',
            count: result.count
        });
    } catch (error) {
        // Log detallado del error
        console.error('Detailed error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
        });

        return NextResponse.json({
            error: 'Error creating products',
            details: error.message
        }, {
            status: 500
        });
    }
} 