import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';  // Asegúrate de tener configurada tu instancia de prisma

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    try {
        if (req.method === 'POST') {
            const template = req.body;
            const updatedTemplate = await prisma.template.update({
                where: { id: String(id) },
                data: {
                    name: template.name,
                    products: template.products,
                    // updatedAt se actualiza automáticamente por Prisma
                }
            });
            return res.status(200).json(updatedTemplate);
        }

        // Manejo de otros métodos HTTP si los necesitas
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);

    } catch (error) {
        console.error('Template update error:', error);
        return res.status(500).json({ error: 'Error updating template' });
    }
} 