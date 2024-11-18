import { NextApiRequest, NextApiResponse } from 'next';
import * as XLSX from 'xlsx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        // Asegúrate de que el archivo se envíe correctamente
        const file = req.body.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            // Convertir el archivo a un buffer
            const buffer = Buffer.from(await file.arrayBuffer());

            // Leer el archivo .xlsx
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convertir la hoja a JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            return res.status(200).json(jsonData);
        } catch (error) {
            console.error('Error processing file:', error);
            return res.status(500).json({ error: 'Error processing file' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
