"use client";

import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { InventoryTemplate, InventoryData } from '@/types/inventory';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { fetchTemplate, updateTemplate } from '@/utils/templateManager';
import TemplateUpload from '@/components/TemplateUpload';
import Navbar from '@/components/Navbar';
import { showNotification } from '@/components/Notification';

interface TemplateUploadProps {
    onTemplateLoad: (template: InventoryTemplate | null) => void;
    inventoryData: Map<string, InventoryData>;
}

interface StockDifferenceResult {
    value: number;
    type: 'increase' | 'decrease';
    oversell?: number; // Cantidad en sobreventa si existe
}

export default function TableUploadRow() {
    const [activeTemplate, setActiveTemplate] = useState<InventoryTemplate | null>(null);
    const [inventoryData, setInventoryData] = useState<Map<string, InventoryData>>(new Map());
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [showTemplateUpload, setShowTemplateUpload] = useState<boolean>(false);
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const [showOdooUpload, setShowOdooUpload] = useState(false);
    const [odooPreviewData, setOdooPreviewData] = useState<any[]>([]);
    const [odooFile, setOdooFile] = useState<File | null>(null);
    const [showTambiaUpload, setShowTambiaUpload] = useState(false);
    const [tambiaPreviewData, setTambiaPreviewData] = useState<any[]>([]);
    const [tambiaFile, setTambiaFile] = useState<File | null>(null);
    const [tambiaSoldFile, setTambiaSoldFile] = useState<File | null>(null);
    const [tambiaAvailableFile, setTambiaAvailableFile] = useState<File | null>(null);
    const [tambiaSoldPreview, setTambiaSoldPreview] = useState<any[]>([]);
    const [tambiaAvailablePreview, setTambiaAvailablePreview] = useState<any[]>([]);
    const [showOdooPreview, setShowOdooPreview] = useState(false);
    const [showTambiaSoldPreview, setShowTambiaSoldPreview] = useState(false);
    const [showTambiaAvailablePreview, setShowTambiaAvailablePreview] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [editingReserve, setEditingReserve] = useState<string | null>(null);
    const [tempReserveValue, setTempReserveValue] = useState<string>('');
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        // Cargar la plantilla desde la base de datos al iniciar
        const loadTemplate = async () => {
            try {
                const template = await fetchTemplate();
                setActiveTemplate(template);
            } catch (error) {
                console.error('Error al cargar la plantilla:', error);
            }
        };

        loadTemplate();
    }, []);

    function processInventoryData(jsonData: any, type: 'odoo' | 'tambia') {
        const newInventoryData = new Map<string, InventoryData>();

        if (!activeTemplate) return;

        // Copiar datos existentes
        inventoryData.forEach((value, key) => {
            newInventoryData.set(key, { ...value });
        });

        jsonData.forEach((row: any) => {
            // Buscar el producto en la plantilla usando el código correcto
            const product = activeTemplate.products.find(p =>
                type === 'odoo'
                    ? p.odooCode === row.codigo // Para datos de Odoo
                    : (p.odooCode === row.codigo_odoo || p.tambiaCode === row.codigo_tambia) // Para datos de TuAmbia
            );

            if (product) {
                const currentData = newInventoryData.get(product.odooCode) || {
                    odooStock: 0,
                    tambiaAvailable: 0,
                    tambiaSold: 0,
                    othersReserved: 0
                };

                // Actualizar datos según el tipo de archivo
                if (type === 'odoo') {
                    currentData.odooStock = Number(row.cantidad || 0);
                } else {
                    currentData.tambiaAvailable = row.disponible || 0;
                    currentData.tambiaSold = row.vendido || 0;
                }

                newInventoryData.set(product.odooCode, currentData);
            }
        });

        setInventoryData(newInventoryData);
    }

    function calculateStockDifference(odooCode: string): StockDifferenceResult {
        const data = inventoryData.get(odooCode);
        if (!data) return { value: 0, type: 'increase' };

        const product = activeTemplate?.products.find(p => p.odooCode === odooCode);
        if (!product) return { value: 0, type: 'increase' };

        const totalStock = data.odooStock;
        const tuambiaReserve = Math.floor(totalStock * (product.reservePercentage / 100));
        const othersReserve = Math.floor(totalStock - tuambiaReserve);
        const globalExtra = 10;
        
        const realTambiaSold = data.tambiaSold;
        const tambiaTotal = data.tambiaAvailable + realTambiaSold;

        if (tambiaTotal <= tuambiaReserve) {
            return {
                value: Math.floor(Math.abs(tuambiaReserve - tambiaTotal)),
                type: tuambiaReserve > tambiaTotal ? 'increase' : 'decrease'
            };
        } else {
            const excess = Math.floor(tambiaTotal - tuambiaReserve);
            
            if (data.tambiaAvailable >= excess) {
                return {
                    value: Math.floor(excess),
                    type: 'decrease'
                };
            } else {
                const canReduceFromAvailable = Math.floor(data.tambiaAvailable);
                const remainingExcess = Math.floor(excess - canReduceFromAvailable);

                if (remainingExcess <= othersReserve) {
                    return {
                        value: Math.floor(canReduceFromAvailable),
                        type: 'decrease'
                    };
                } else {
                    return {
                        value: Math.floor(canReduceFromAvailable),
                        type: 'decrease',
                        oversell: Math.floor(remainingExcess - othersReserve)
                    };
                }
            }
        }
    }

    async function previewData() {
        if (!file) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            processInventoryData(jsonData, 'tambia');
            setLoading(false);
        };
        reader.readAsBinaryString(file);
    }

    const processTemplateFile = async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Crear nueva plantilla
                const newTemplate: InventoryTemplate = {
                    id: "general",
                    name: "Plantilla General",
                    updatedAt: new Date().toISOString(),
                    products: jsonData.map((row: any) => ({
                        tambiaCode: row['Código TuAmbia']?.toString(),
                        odooCode: row['Código Odoo']?.toString(),
                        tambiaName: row['Nombre TuAmbia'],
                        odooName: row['Nombre Odoo'],
                        category: row['Categoría'],
                        visible: row['Visible']?.toLowerCase() === 'si',
                        reservePercentage: 75
                    })),
                };

                await updateTemplate(newTemplate);
                setActiveTemplate(newTemplate);
                showNotification({
                    type: 'success',
                    title: 'Plantilla actualizada',
                    message: 'La plantilla se ha actualizado exitosamente en el sistema.',
                    duration: 5000
                });
            } catch (error) {
                console.error('Error al procesar el archivo:', error);
                showNotification({
                    type: 'error',
                    title: 'Error al procesar archivo',
                    message: 'Hubo un problema al procesar el archivo. Verifica el formato y vuelve a intentarlo.',
                    duration: 7000
                });
            }
        };
        reader.readAsBinaryString(file);
    };

    const validateOdooStructure = (jsonData: any[]) => {
        const requiredColumns = [
            'Producto/Código de barras',
            'Producto',
            'Unidad de medida',
            'Cantidad disponible'
        ];

        // Encontrar la primera fila que tenga todas las columnas necesarias
        const validRow = jsonData.find(row => {
            const rowColumns = Object.keys(row);
            return requiredColumns.every(column => column in row);
        });

        if (!validRow) {
            return {
                isValid: false,
                missingColumns: requiredColumns
            };
        }

        return {
            isValid: true,
            missingColumns: []
        };
    };

    const processOdooFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const validation = validateOdooStructure(jsonData);
                if (!validation.isValid) {
                    showNotification({
                        type: 'error',
                        title: 'Error en la estructura del archivo',
                        message: `El archivo de Odoo no tiene el formato correcto.
                            <br><br><b>No se encontraron filas con la estructura correcta. Se requieren las columnas:</b>
                            ${validation.missingColumns.map(col => `<br>• ${col}`).join('')}`,
                        duration: 15000
                    });
                    return;
                }

                // Procesar y agrupar datos por producto, ignorando las filas que no tienen todas las columnas
                const processedData = jsonData.reduce((acc: any[], row: any) => {
                    // Verificar si la fila actual es un producto válido
                    if (!('Producto/Código de barras' in row && 'Cantidad disponible' in row)) {
                        return acc;
                    }

                    const existingProduct = acc.find(p => p.codigo === row['Producto/Código de barras']);

                    if (existingProduct) {
                        existingProduct.cantidad += Number(row['Cantidad disponible'] || 0);
                    } else {
                        acc.push({
                            codigo: row['Producto/Código de barras'],
                            producto: row['Producto'],
                            unidad: row['Unidad de medida'],
                            cantidad: Number(row['Cantidad disponible'] || 0)
                        });
                    }
                    return acc;
                }, []);

                setOdooPreviewData(processedData);
                setOdooFile(file);
                showNotification({
                    type: 'success',
                    title: 'Archivo procesado',
                    message: 'El archivo de Odoo se ha cargado correctamente.',
                    duration: 3000
                });
            } catch (error) {
                console.error('Error al procesar archivo de Odoo:', error);
                showNotification({
                    type: 'error',
                    title: 'Error al procesar archivo',
                    message: 'Hubo un problema al procesar el archivo de Odoo. Verifica que sea un archivo Excel válido.',
                    duration: 5000
                });
            }
        };
        reader.readAsBinaryString(file);
    };

    const validateTambiaSoldStructure = (row: any) => {
        const requiredColumns = [
            'Código del producto',
            'Nombre del producto',
            'Categoría',
            'Marca',
            'Cantidad'
        ];

        const fileColumns = Object.keys(row);
        const missingColumns = requiredColumns.filter(column => !(column in row));

        return {
            isValid: missingColumns.length === 0,
            missingColumns
        };
    };

    const processTambiaSoldFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const validation = validateTambiaSoldStructure(jsonData[0]);
                if (!validation.isValid) {
                    showNotification({
                        type: 'error',
                        title: 'Error en la estructura del archivo',
                        message: `El archivo de ventas de TuAmbia no tiene el formato correcto.
                            <br><br><b>Columnas faltantes:</b>
                            ${validation.missingColumns.map(col => `<br>• ${col}`).join('')}
                            <br><br><b>Columnas encontradas:</b>
                            ${Object.keys(jsonData[0] as object).map(col => `<br>• ${col}`).join('')}`,
                        duration: 15000
                    });
                    return;
                }

                const processedData = jsonData.map((row: any) => ({
                    codigo: row['Código del producto'] || row['codigo'],
                    producto: row['Nombre del producto'] || row['nombre del producto'],
                    categoria: row['Categoría'] || row['categoria'],
                    marca: row['Marca'] || row['marca'],
                    cantidad: row['Cantidad'] || row['cantidad']
                }));

                setTambiaSoldPreview(processedData);
                setTambiaSoldFile(file);
                showNotification({
                    type: 'success',
                    title: 'Archivo procesado',
                    message: 'El archivo de ventas de TuAmbia se ha cargado correctamente.',
                    duration: 3000
                });
            } catch (error) {
                console.error('Error al procesar archivo de ventas:', error);
                showNotification({
                    type: 'error',
                    title: 'Error al procesar archivo',
                    message: 'Hubo un problema al procesar el archivo de ventas. Verifica que sea un archivo Excel válido.',
                    duration: 5000
                });
            }
        };
        reader.readAsBinaryString(file);
    };

    const validateTambiaAvailableStructure = (row: any) => {
        const requiredColumns = [
            'Código',
            'Nombre',
            'Marca',
            'Categoría',
            'Visible',
            'Disponible'
        ];

        const fileColumns = Object.keys(row);
        const missingColumns = requiredColumns.filter(column => !(column in row));

        return {
            isValid: missingColumns.length === 0,
            missingColumns
        };
    };

    const processTambiaAvailableFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const validation = validateTambiaAvailableStructure(jsonData[0]);
                if (!validation.isValid) {
                    showNotification({
                        type: 'error',
                        title: 'Error en la estructura del archivo',
                        message: `El archivo de disponibilidad de TuAmbia no tiene el formato correcto.
                            <br><br><b>Columnas faltantes:</b>
                            ${validation.missingColumns.map(col => `<br>• ${col}`).join('')}
                            <br><br><b>Columnas encontradas:</b>
                            ${Object.keys(jsonData[0] as object).map(col => `<br>• ${col}`).join('')}`,
                        duration: 15000
                    });
                    return;
                }

                const processedData = jsonData.map((row: any) => ({
                    codigo: row['Código'] || row['codigo'],
                    nombre: row['Nombre'] || row['nombre'],
                    marca: row['Marca'] || row['marca'],
                    categoria: row['Categoría'] || row['categoria'],
                    visible: row['Visible'] || row['visible'],
                    disponible: row['Disponibi'] || row['disponible'] || row['Disponible']
                }));

                setTambiaAvailablePreview(processedData);
                setTambiaAvailableFile(file);
                showNotification({
                    type: 'success',
                    title: 'Archivo procesado',
                    message: 'El archivo de disponibilidad de TuAmbia se ha cargado correctamente.',
                    duration: 3000
                });
            } catch (error) {
                console.error('Error al procesar archivo de disponibles:', error);
                showNotification({
                    type: 'error',
                    title: 'Error al procesar archivo',
                    message: 'Hubo un problema al procesar el archivo de disponibilidad. Verifica que sea un archivo Excel válido.',
                    duration: 5000
                });
            }
        };
        reader.readAsBinaryString(file);
    };

    // Función para manejar la confirmación de datos de TuAmbia
    const handleTambiaDataConfirm = () => {
        if (!tambiaSoldPreview.length || !tambiaAvailablePreview.length) {
            showNotification({
                type: 'warning',
                title: 'Archivos incompletos',
                message: 'Por favor, carga ambos archivos (vendidos y disponibles) antes de confirmar.',
                duration: 5000
            });
            return;
        }

        const newInventoryData = new Map<string, InventoryData>();

        // Copiar datos existentes
        inventoryData.forEach((value, key) => {
            newInventoryData.set(key, { ...value });
        });

        // Procesar datos de ventas
        tambiaSoldPreview.forEach((row) => {
            const product = activeTemplate?.products.find(p =>
                p.tambiaCode === row.codigo || p.odooCode === row.codigo
            );

            if (product) {
                const currentData = newInventoryData.get(product.odooCode) || {
                    odooStock: 0,
                    tambiaAvailable: 0,
                    tambiaSold: 0,
                    othersReserved: 0
                };

                currentData.tambiaSold = Number(row.cantidad || 0);
                newInventoryData.set(product.odooCode, currentData);
            }
        });

        // Procesar datos de disponibilidad
        tambiaAvailablePreview.forEach((row) => {
            const product = activeTemplate?.products.find(p =>
                p.tambiaCode === row.codigo || p.odooCode === row.codigo
            );

            if (product) {
                const currentData = newInventoryData.get(product.odooCode) || {
                    odooStock: 0,
                    tambiaAvailable: 0,
                    tambiaSold: 0,
                    othersReserved: 0
                };

                currentData.tambiaAvailable = Number(row.disponible || 0);
                newInventoryData.set(product.odooCode, currentData);
            }
        });

        // Actualizar el estado
        setInventoryData(newInventoryData);

        // Solo cerrar el modal, mantener los estados de los archivos
        setShowTambiaUpload(false);

        // NO limpiar estos estados:
        // setTambiaSoldFile(null);
        // setTambiaAvailableFile(null);
        // setTambiaSoldPreview([]);
        // setTambiaAvailablePreview([]);

        showNotification({
            type: 'success',
            title: 'Datos actualizados',
            message: 'Los datos de TuAmbia han sido procesados exitosamente.',
            duration: 4000
        });
    };

    // Agregar función para manejar la selección de todas las filas
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allProductCodes = activeTemplate?.products
                .filter(product => product.visible)
                .map(product => product.odooCode);
            setSelectedRows(new Set(allProductCodes));
        } else {
            setSelectedRows(new Set());
        }
    };

    // Función para copiar al portapapeles
    const copyToClipboard = () => {
        const rows = activeTemplate?.products
            .filter(product => {
                if (selectedRows.size === 0) return true;
                return selectedRows.has(product.odooCode);
            })
            .filter(product => {
                const stockDiff = calculateStockDifference(product.odooCode);
                return stockDiff.value !== 0;
            })
            .map(product => {
                const stockDiff = calculateStockDifference(product.odooCode);
                return `${product.tambiaName}${' :  '}${stockDiff.type === 'increase' ? '+' : '-'}${stockDiff.value}`;
            });

        if (rows && rows.length > 0) {
            navigator.clipboard.writeText(rows.join('\n'));
            showNotification({
                type: 'success',
                title: 'Lista copiada',
                message: 'La lista de ajustes ha sido copiada al portapapeles.',
                duration: 3000
            });
        } else {
            showNotification({
                type: 'warning',
                title: 'Sin datos para copiar',
                message: 'No hay ajustes disponibles para copiar en este momento.',
                duration: 4000
            });
        }
    };

    function calculateAvailableStock(data: InventoryData, product: any): {
        tuambiaAvailable: number;
        othersAvailable: number;
    } {
        const totalStock = data.odooStock;
        const tuambiaReserve = totalStock * (product.reservePercentage / 100);
        const othersAvailable = totalStock - tuambiaReserve;

        return {
            tuambiaAvailable: tuambiaReserve - (data.tambiaAvailable + data.tambiaSold),
            othersAvailable: othersAvailable - data.othersReserved
        };
    }

    function canReserveStock(
        data: InventoryData,
        product: any,
        amount: number,
        isForTuambia: boolean
    ): boolean {
        const availability = calculateAvailableStock(data, product);

        if (isForTuambia) {
            return amount <= availability.tuambiaAvailable;
        }

        return amount <= availability.othersAvailable;
    }

    // Función para mostrar la disponibilidad en la tabla
    function renderAvailability(data: InventoryData, product: any) {
        const availability = calculateAvailableStock(data, product);
        return (
            <div className="space-y-1">
                <div className="text-sm">
                    <span className="font-medium">TuAmbia: </span>
                    <span className={availability.tuambiaAvailable > 0 ? 'text-green-500' : 'text-red-500'}>
                        {availability.tuambiaAvailable}
                    </span>
                </div>
                <div className="text-sm">
                    <span className="font-medium">Otros: </span>
                    <span className={availability.othersAvailable > 0 ? 'text-green-500' : 'text-red-500'}>
                        {availability.othersAvailable}
                    </span>
                </div>
            </div>
        );
    }

    // Función para calcular lo reservado por otros clientes
    function calculateOthersReserved(odooCode: string): number {
        const data = inventoryData.get(odooCode);
        if (!data) return 0;

        const product = activeTemplate?.products.find(p => p.odooCode === odooCode);
        if (!product) return 0;

        const totalStock = data.odooStock;
        const tuambiaReserve = Math.floor(totalStock * (product.reservePercentage / 100));
        const othersReserve = Math.floor(totalStock - tuambiaReserve);

        const tambiaTotal = data.tambiaAvailable + data.tambiaSold;
        const excess = Math.floor(tambiaTotal - tuambiaReserve);

        if (excess <= 0 || data.tambiaAvailable >= excess) {
            return Math.floor(othersReserve);
        }

        const remainingExcess = Math.floor(excess - data.tambiaAvailable);
        return Math.floor(Math.max(0, othersReserve - remainingExcess));
    }

    // Función modificada para manejar el inicio de la edición
    const handleStartEditing = (odooCode: string, currentValue: number) => {
        setEditingReserve(odooCode);
        setTempReserveValue(currentValue.toString());
    };

    // Función para manejar cambios durante la edición
    const handleReserveChange = (value: string) => {
        // Permitir valores vacíos durante la edición
        if (value === '') {
            setTempReserveValue(value);
            return;
        }

        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
        setTempReserveValue(value);
    };

    // Función para guardar el cambio
    const handleReserveUpdate = (odooCode: string) => {
        const numValue = parseInt(tempReserveValue);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
            setEditingReserve(null);
            return;
        }

        if (activeTemplate) {
            const newTemplate = {
                ...activeTemplate,
                products: activeTemplate.products.map(product => {
                    if (product.odooCode === odooCode) {
                        return { ...product, reservePercentage: numValue };
                    }
                    return product;
                })
            };
            setActiveTemplate(newTemplate);
            localStorage.setItem('currentTemplate', JSON.stringify(newTemplate));
        }
        setEditingReserve(null);
    };

    const handleTemplateLoad = (template: InventoryTemplate | null) => {
        setActiveTemplate(template);
        if (!template) {
            // Si se eliminó la plantilla, volvemos a la vista principal
            setShowTemplateUpload(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <Navbar
                showTemplateUpload={showTemplateUpload}
                onToggleTemplate={() => setShowTemplateUpload(!showTemplateUpload)}
                hasTemplate={activeTemplate !== null}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {showTemplateUpload ? (
                    <TemplateUpload
                        onTemplateLoad={handleTemplateLoad}
                        inventoryData={inventoryData}
                    />
                ) : !activeTemplate ? (
                    <div className="text-center py-12">
                        <div className="inline-block p-6 bg-gray-800 rounded-lg shadow-lg">
                            <svg
                                className="mx-auto h-12 w-12 text-yellow-500 mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <h3 className="text-xl font-medium text-white mb-2">No hay plantilla configurada</h3>
                            <p className="text-gray-400 mb-4">
                                Para comenzar, necesitas cargar una plantilla con los productos.
                            </p>
                            <button
                                onClick={() => setShowTemplateUpload(true)}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Ir a Gestión de Plantilla
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Controles de carga de archivos */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border border-slate-600 rounded-lg bg-gray-800">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">Datos de Odoo</h3>
                                        <button
                                            onClick={() => setShowOdooUpload(true)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Agregar Datos de Odoo
                                        </button>
                                    </div>

                                    {/* Feedback del estado de carga */}
                                    <div className="text-sm">
                                        <span className={`font-medium ${odooFile ? 'text-green-500' : 'text-yellow-500'}`}>
                                            {odooFile
                                                ? `✓ Archivo cargado: ${odooFile.name}`
                                                : '⚠ No hay datos de Odoo cargados'}
                                        </span>
                                    </div>
                                </div>

                                {/* Modal de carga de Odoo */}
                                <Transition appear show={showOdooUpload} as={Fragment}>
                                    <Dialog as="div" className="relative z-10" onClose={() => setShowOdooUpload(false)}>
                                        <Transition.Child
                                            as={Fragment}
                                            enter="ease-out duration-300"
                                            enterFrom="opacity-0"
                                            enterTo="opacity-100"
                                            leave="ease-in duration-200"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                                        </Transition.Child>

                                        <div className="fixed inset-0 overflow-y-auto">
                                            <div className="flex min-h-full items-center justify-center p-4">
                                                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white mb-4">
                                                        Cargar Datos de Odoo
                                                    </Dialog.Title>

                                                    <div className="space-y-4">
                                                        <input
                                                            type="file"
                                                            accept=".xlsx,.xls"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) processOdooFile(file);
                                                            }}
                                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                        />

                                                        {odooFile && (
                                                            <div className="flex items-center gap-2 bg-slate-700 p-2 rounded">
                                                                <span className="text-white">{odooFile.name}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setOdooFile(null);
                                                                        setOdooPreviewData([]);
                                                                    }}
                                                                    className="p-1 bg-red-500 rounded-full hover:bg-red-600"
                                                                >
                                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}

                                                        {odooPreviewData.length > 0 && (
                                                            <button
                                                                onClick={() => setShowOdooPreview(!showOdooPreview)}
                                                                className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-2"
                                                            >
                                                                {showOdooPreview ? '▼ Ocultar' : '▶ Mostrar'} vista previa
                                                            </button>
                                                        )}

                                                        {showOdooPreview && odooPreviewData.length > 0 && (
                                                            <OdooPreviewTable data={odooPreviewData} />
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setShowOdooUpload(false)}
                                                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (odooPreviewData.length > 0) {
                                                                    processInventoryData(odooPreviewData, 'odoo');
                                                                    setShowOdooUpload(false);
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                            disabled={!odooFile}
                                                        >
                                                            Confirmar
                                                        </button>
                                                    </div>
                                                </Dialog.Panel>
                                            </div>
                                        </div>
                                    </Dialog>
                                </Transition>
                            </div>
                            <div className="p-4 border border-slate-600 rounded-lg bg-gray-800">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">Datos de TuAmbia</h3>
                                        <button
                                            onClick={() => setShowTambiaUpload(true)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Agregar Datos de TuAmbia
                                        </button>
                                    </div>

                                    {/* Feedback del estado de carga */}
                                    <div className="text-sm space-y-1">
                                        <span className={`font-medium block ${tambiaSoldFile ? 'text-green-500' : 'text-yellow-500'}`}>
                                            {tambiaSoldFile
                                                ? `✓ Archivo de vendidos cargado: ${tambiaSoldFile.name}`
                                                : '⚠ No hay datos de vendidos cargados'}
                                        </span>
                                        <span className={`font-medium block ${tambiaAvailableFile ? 'text-green-500' : 'text-yellow-500'}`}>
                                            {tambiaAvailableFile
                                                ? `✓ Archivo de disponibles cargado: ${tambiaAvailableFile.name}`
                                                : '⚠ No hay datos de disponibles cargados'}
                                        </span>
                                    </div>
                                </div>

                                {/* Modal de carga de TuAmbia */}
                                <Transition appear show={showTambiaUpload} as={Fragment}>
                                    <Dialog as="div" className="relative z-10" onClose={() => setShowTambiaUpload(false)}>
                                        <Transition.Child
                                            as={Fragment}
                                            enter="ease-out duration-300"
                                            enterFrom="opacity-0"
                                            enterTo="opacity-100"
                                            leave="ease-in duration-200"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                                        </Transition.Child>

                                        <div className="fixed inset-0 overflow-y-auto">
                                            <div className="flex min-h-full items-center justify-center p-4">
                                                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white mb-4">
                                                        Cargar Datos de TuAmbia
                                                    </Dialog.Title>

                                                    <div className="space-y-6">
                                                        {/* Sección de Vendidos */}
                                                        <div className="space-y-4">
                                                            <h4 className="font-medium text-white">Productos Vendidos</h4>
                                                            <input
                                                                type="file"
                                                                accept=".xlsx,.xls"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) processTambiaSoldFile(file);
                                                                }}
                                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                            />
                                                            {/* Feedback de archivo vendidos */}
                                                            <div className="text-sm">
                                                                <span className={`font-medium ${tambiaSoldFile ? 'text-green-500' : 'text-yellow-500'}`}>
                                                                    {tambiaSoldFile
                                                                        ? `✓ Archivo de vendidos cargado: ${tambiaSoldFile.name}`
                                                                        : '⚠ No hay datos de vendidos cargados'}
                                                                </span>
                                                            </div>
                                                            {/* Botón para mostrar/ocultar preview */}
                                                            {tambiaSoldPreview.length > 0 && (
                                                                <button
                                                                    onClick={() => setShowTambiaSoldPreview(!showTambiaSoldPreview)}
                                                                    className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-2"
                                                                >
                                                                    {showTambiaSoldPreview ? '▼ Ocultar' : '▶ Mostrar'} vista previa
                                                                </button>
                                                            )}
                                                            {/* Tabla de preview condicional */}
                                                            {showTambiaSoldPreview && tambiaSoldPreview.length > 0 && (
                                                                <SoldPreviewTable data={tambiaSoldPreview} />
                                                            )}
                                                        </div>

                                                        {/* Sección de Disponibles */}
                                                        <div className="space-y-4">
                                                            <h4 className="font-medium text-white">Productos Disponibles</h4>
                                                            <input
                                                                type="file"
                                                                accept=".xlsx,.xls"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) processTambiaAvailableFile(file);
                                                                }}
                                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                            />
                                                            {/* Feedback de archivo disponibles */}
                                                            <div className="text-sm">
                                                                <span className={`font-medium ${tambiaAvailableFile ? 'text-green-500' : 'text-yellow-500'}`}>
                                                                    {tambiaAvailableFile
                                                                        ? `✓ Archivo de disponibles cargado: ${tambiaAvailableFile.name}`
                                                                        : '⚠ No hay datos de disponibles cargados'}
                                                                </span>
                                                            </div>
                                                            {/* Botón para mostrar/ocultar preview */}
                                                            {tambiaAvailablePreview.length > 0 && (
                                                                <button
                                                                    onClick={() => setShowTambiaAvailablePreview(!showTambiaAvailablePreview)}
                                                                    className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-2"
                                                                >
                                                                    {showTambiaAvailablePreview ? '▼ Ocultar' : '▶ Mostrar'} vista previa
                                                                </button>
                                                            )}
                                                            {/* Tabla de preview condicional */}
                                                            {showTambiaAvailablePreview && tambiaAvailablePreview.length > 0 && (
                                                                <AvailablePreviewTable data={tambiaAvailablePreview} />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setShowTambiaUpload(false)}
                                                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={handleTambiaDataConfirm}
                                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                            disabled={!tambiaSoldFile || !tambiaAvailableFile}
                                                        >
                                                            Confirmar
                                                        </button>
                                                    </div>
                                                </Dialog.Panel>
                                            </div>
                                        </div>
                                    </Dialog>
                                </Transition>
                            </div>
                        </div>

                        {/* Tabla de Resultados */}
                        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-blue-800 border-b border-slate-600 uppercase bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3">
                                            <input
                                                type="checkbox"
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                checked={selectedRows.size > 0 && selectedRows.size === activeTemplate.products.filter(p => p.visible).length}
                                            />
                                        </th>
                                        <th className="px-6 py-3">Nombre TuAmbia</th>
                                        <th className="px-6 py-3">Disponibilidad Odoo</th>
                                        <th className="px-6 py-3">Disponibilidad TuAmbia</th>
                                        <th className="px-6 py-3">Vendidos TuAmbia</th>
                                        <th className="px-6 py-3">Ajuste Necesario</th>
                                        <th className="px-6 py-3">Reserva PDV/KO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeTemplate?.products
                                        ?.filter(product => product.visible)
                                        .map(product => {
                                            const data = inventoryData.get(product.odooCode);
                                            const stockDiff = calculateStockDifference(product.odooCode);
                                            const othersReserved = calculateOthersReserved(product.odooCode);
                                            return (
                                                <tr key={product.odooCode} className="bg-slate-800 text-slate-300 border-b border-slate-500 hover:bg-slate-700">
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRows.has(product.odooCode)}
                                                            onChange={(e) => {
                                                                const newSelected = new Set(selectedRows);
                                                                if (e.target.checked) {
                                                                    newSelected.add(product.odooCode);
                                                                } else {
                                                                    newSelected.delete(product.odooCode);
                                                                }
                                                                setSelectedRows(newSelected);
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">{product.tambiaName}</td>
                                                    <td className="px-6 py-4">{data?.odooStock || 0}</td>
                                                    <td className="px-6 py-4">{data?.tambiaAvailable || 0}</td>
                                                    <td className="px-6 py-4">{data?.tambiaSold || 0}</td>
                                                    <td className="px-6 py-4">
                                                        {stockDiff.value !== 0 && (
                                                            <div className="space-y-1">
                                                                <span className={`font-bold ${stockDiff.type === 'increase'
                                                                    ? 'text-green-600'
                                                                    : 'text-red-600'
                                                                    }`}>
                                                                    {stockDiff.type === 'increase' ? '+' : '-'}
                                                                    {stockDiff.value}
                                                                </span>
                                                                {stockDiff.oversell && (
                                                                    <div className="text-xs font-medium text-red-500 bg-red-100 px-2 py-1 rounded">
                                                                        Sobreventa: {stockDiff.oversell}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">{othersReserved}</td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>

                        {/* Agregar botón para copiar */}
                        <button
                            onClick={copyToClipboard}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Copiar Lista de Ajustes
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
// Componente para la tabla de preview de vendidos
const SoldPreviewTable = ({ data }: { data: any[] }) => (
    <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700">
                <tr>
                    <th className="px-6 py-3">Código</th>
                    <th className="px-6 py-3">Nombre del producto</th>
                    <th className="px-6 py-3">Categoría</th>
                    <th className="px-6 py-3">Marca</th>
                    <th className="px-6 py-3">Cantidad</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index} className="border-b border-gray-700">
                        <td className="px-6 py-4">{item.codigo}</td>
                        <td className="px-6 py-4">{item.producto}</td>
                        <td className="px-6 py-4">{item.categoria}</td>
                        <td className="px-6 py-4">{item.marca}</td>
                        <td className="px-6 py-4">{item.cantidad}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Componente para la tabla de preview de disponibles
const AvailablePreviewTable = ({ data }: { data: any[] }) => (
    <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700">
                <tr>
                    <th className="px-6 py-3">Código</th>
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Marca</th>
                    <th className="px-6 py-3">Categoría</th>
                    <th className="px-6 py-3">Visible</th>
                    <th className="px-6 py-3">Disponible</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index} className="border-b border-gray-700">
                        <td className="px-6 py-4">{item.codigo}</td>
                        <td className="px-6 py-4">{item.nombre}</td>
                        <td className="px-6 py-4">{item.marca}</td>
                        <td className="px-6 py-4">{item.categoria}</td>
                        <td className="px-6 py-4">{item.visible}</td>
                        <td className="px-6 py-4">{item.disponible}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Add this component before the closing export
const OdooPreviewTable = ({ data }: { data: any[] }) => (
    <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700">
                <tr>
                    <th className="px-6 py-3">Código</th>
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3">Unidad</th>
                    <th className="px-6 py-3">Cantidad</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index} className="border-b border-gray-700">
                        <td className="px-6 py-4">{item.codigo}</td>
                        <td className="px-6 py-4">{item.producto}</td>
                        <td className="px-6 py-4">{item.unidad}</td>
                        <td className="px-6 py-4">{item.cantidad}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

