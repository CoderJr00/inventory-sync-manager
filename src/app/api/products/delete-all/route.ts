import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
    try {
        // Eliminar todos los productos en una sola operación
        await prisma.product.deleteMany({});

        return NextResponse.json({ message: 'All products deleted successfully' });
    } catch (error) {
        console.error('Error deleting all products:', error);
        return NextResponse.json({ error: 'Error deleting all products' }, { status: 500 });
    }
} 