import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';  // Asegúrate de tener configurada tu instancia de prisma

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    try {
        if (req.method === 'GET') {
            const products = await prisma.product.findMany(); // Obtener todos los productos
            return res.status(200).json(products); // Devolver los productos
        }
        else if (req.method === 'POST') {
            // Validar la estructura del producto
            const product = req.body;
            console.log(product)

            // Verificar campos requeridos
            const requiredFields = ['odooCode', 'category', 'odooName'];
            const missingFields = requiredFields.filter(field => !product[field]);

            if (missingFields.length > 0) {
                return res.status(400).json({ error: 'Missing required fields', details: missingFields });
            }

            const newProduct = await prisma.product.create({
                data: {
                    tambiaCode: product.tambiaCode || null,
                    odooCode: product.odooCode,
                    tambiaName: product.tambiaName || null,
                    odooName: product.odooName,
                    category: product.category,
                    visible: product.visible || false,
                    reservePercentage: product.reservePercentage || 75,
                    minimum: product.minimum || 0,
                    maximum: product.maximum || 0,
                    fabricable: product.fabricable || false,
                    cantidadInventario: product.cantidadInventario || 0,
                    unidadMedida: product.unidadMedida || null
                }
            });
            return res.status(201).json(newProduct); // Devuelve el nuevo producto creado
        }
        else if (req.method === 'PUT') {
            // Actualizar un producto existente
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Invalid product ID' });
            }

            const product = req.body;

            // Verificar campos requeridos
            const requiredFields = ['odooCode', 'category', 'odooName'];
            const missingFields = requiredFields.filter(field => !product[field]);

            if (missingFields.length > 0) {
                return res.status(400).json({ error: 'Missing required fields', details: missingFields });
            }

            const updatedProduct = await prisma.product.update({
                where: { id: String(id) },
                data: {
                    tambiaCode: product.tambiaCode || null,
                    odooCode: product.odooCode,
                    tambiaName: product.tambiaName || null,
                    odooName: product.odooName,
                    category: product.category,
                    visible: product.visible || false,
                    reservePercentage: product.reservePercentage || 75,
                    minimum: product.minimum || 0,
                    maximum: product.maximum || 0,
                    fabricable: product.fabricable || false,
                    cantidadInventario: product.cantidadInventario || 0,
                    unidadMedida: product.unidadMedida || null
                }
            });
            return res.status(200).json(updatedProduct); // Devuelve el producto actualizado
        }
        else if (req.method === 'DELETE') {
            // Eliminar todos los productos
            await prisma.product.deleteMany(); // Eliminar todos los productos
            return res.status(204).end(); // No content
        }
        else {
            // Manejo de otros métodos HTTP si los necesitas
            res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Product API error:', error);
        return res.status(500).json({ error: 'Error processing request', details: error });
    }
} 