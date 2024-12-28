import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        // Actualizar todos los productos en una sola operación
        await prisma.product.updateMany({
            data: {
                cantidadInventario: 0
            }
        });

        return NextResponse.json({ message: 'All products stock reset successfully' });
    } catch (error) {
        console.error('Error resetting products stock:', error);
        return NextResponse.json({ error: 'Error resetting products stock' }, { status: 500 });
    }
} 