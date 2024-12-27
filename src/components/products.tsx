"use client"

import { useState, Fragment, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import * as XLSX from 'xlsx'
import { showNotification } from '@/components/Notification'
import { Product } from '@/types/inventory'
import { createProduct } from '@/utils/productsManager'
import { LoadingOverlay } from './LoadingOverlay'

interface PlanTrabajoData {
    codigo: string
    producto: string
    unidad: string
    cantidad: number
    minimum: number
    maximum: number
}

export function ProductsView() {
    const [showHelp, setShowHelp] = useState(false);
    const [showUpload, setShowUpload] = useState(false)
    const [stockUpload, setStockUpload] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [stockFile, setStockFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<Product[]>([])
    const [previewStockData, setPreviewStockData] = useState<Product[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [showPreview, setShowPreview] = useState(false)
    const [showStockPreview, setShowStockPreview] = useState(false)
    const [filterStatus, setFilterStatus] = useState<'all' | 'optimal' | 'needed'>('all');
    const [editingAmount, setEditingAmount] = useState<string | null>(null);
    const [tempAmountValue, setTempAmountValue] = useState<string>('');
    const [isUpdatingAmount, setIsUpdatingAmount] = useState<string | null>(null);
    const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                if (!response.ok) throw new Error('Error fetching products');
                const prods = await response.json();
                setProducts(prods);
                console.log('Productos en la base de datos:', products); // Mostrar productos en la consola
            } catch (error) {
                console.error('Error al cargar productos:', error);
            }
        };

        fetchProducts(); // Llamar a la función para obtener productos
        setIsLoading(false);
    }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

    const validateFileStructure = (jsonData: any[]) => {
        const requiredColumns = [
            'Código de barras',
            'Nombre',
            'Unidad de medida',
            'Abasteciendo cant. min.',
            'Abasteciendo cant. max.',
            'Categoría interna',
        ]

        const validRow = jsonData.find(row => {
            const rowColumns = Object.keys(row)
            return requiredColumns.every(column => column in row)
        })

        if (!validRow) {
            return {
                isValid: false,
                missingColumns: requiredColumns
            }
        }

        return {
            isValid: true,
            missingColumns: []
        }
    }
    const validateStockFileStructure = (jsonData: any[]) => {
        const requiredColumns = [
            'Producto/Código de barras',
            'Producto',
            'Cantidad',
            'Unidad de medida',
            'Producto/Categoría interna',
            'Producto/ Abasteciendo cant. min.',
            'Producto/ Abasteciendo cant. max.',
            'Producto/Lista de materiales/Activo',
        ]

        const validRow = jsonData.find(row => {
            const rowColumns = Object.keys(row)
            return requiredColumns.every(column => column in row)
        })

        if (!validRow) {
            return {
                isValid: false,
                missingColumns: requiredColumns
            }
        }

        return {
            isValid: true,
            missingColumns: []
        }
    }

    const processFile = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: "binary" })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet)

                const validation = validateFileStructure(jsonData)
                if (!validation.isValid) {
                    showNotification({
                        type: 'error',
                        title: 'Error en la estructura del archivo',
                        message: `El archivo no tiene el formato correcto.
              <br><br><b>No se encontraron filas con la estructura correcta. Se requieren las columnas:</b>
              ${validation.missingColumns.map(col => `<br>• ${col}`).join('')}`,
                        duration: 15000
                    })
                    return
                }

                const processedData = jsonData.reduce((acc: Product[], row: any) => {
                    const existingProduct = acc.find(p => p.odooCode === row['Código de barras'])

                    if (existingProduct) {
                        // existingProduct.cantidad += Number(row['Cantidad disponible'] || 0)
                    } else {
                        acc.push({
                            odooCode: row['Código de barras'],
                            odooName: row['Nombre'],
                            unidadMedida: row['Unidad de medida'],
                            category: row['Categoría interna' || null],
                            // cantidad: Number(row['Cantidad disponible'] || 0),
                            minimum: Number(row['Abasteciendo cant. min.'] || 0),
                            maximum: Number(row['Abasteciendo cant. max.'] || 0),
                            fabricable: Boolean(row['Lista de materiales/Activo'] || false),
                            reservePercentage: 75,
                            tambiaCode: null,
                            tambiaName: null,
                            visible: false,
                            cantidadInventario: Number(row['Cantidad disponible'] || 0),
                        })
                    }
                    return acc
                }, [])

                setPreviewData(processedData)
                setFile(file)
                showNotification({
                    type: 'success',
                    title: 'Archivo procesado',
                    message: 'El archivo se ha cargado correctamente.',
                    duration: 3000
                })
            } catch (error) {
                console.error('Error al procesar archivo:', error)
                showNotification({
                    type: 'error',
                    title: 'Error al procesar archivo',
                    message: 'Hubo un problema al procesar el archivo. Verifica que sea un archivo Excel válido.',
                    duration: 5000
                })
            }
        }
        reader.readAsBinaryString(file)
    }

    const processStockFile = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: "binary" })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet)

                const validation = validateStockFileStructure(jsonData)
                if (!validation.isValid) {
                    showNotification({
                        type: 'error',
                        title: 'Error en la estructura del archivo',
                        message: `El archivo no tiene el formato correcto.
                    <br><br><b>No se encontraron filas con la estructura correcta. Se requieren las columnas:</b>
                    ${validation.missingColumns.map(col => `<br>• ${col}`).join('')}`,
                        duration: 15000
                    })
                    return
                }

                // Crear un array para productos nuevos y otro para actualizaciones
                const updatedProducts: Product[] = [];
                const newProducts: Product[] = [];

                jsonData.forEach((row: any) => {
                    if (!('Producto/Código de barras' in row && 'Producto' in row)) {
                        return;
                    }

                    // Buscar si el producto existe en products
                    const existingProduct = products.find(p =>
                        p.odooCode === row['Producto/Código de barras']
                    );

                    if (existingProduct) {
                        // Si existe, actualizar solo la cantidad
                        updatedProducts.push({
                            ...existingProduct,
                            cantidadInventario: Number(row['Cantidad'] || 0)
                        });
                    } else {
                        // Si no existe, crear nuevo producto
                        newProducts.push({
                            odooCode: row['Producto/Código de barras'],
                            odooName: row['Producto'],
                            minimum: Number(row['Producto/ Abasteciendo cant. min.'] || 0),
                            maximum: Number(row['Producto/ Abasteciendo cant. max.'] || 0),
                            unidadMedida: row['Unidad de medida'],
                            cantidadInventario: Number(row['Cantidad'] || 0),
                            category: row['Producto/Categoría interna' || null],
                            fabricable: Boolean(row['Producto/Lista de materiales/Activo'] || false),
                            reservePercentage: 75,
                            tambiaCode: null,
                            tambiaName: null,
                            visible: false,
                        });
                    }
                });

                // Actualizar productos existentes
                if (updatedProducts.length > 0) {
                    updatedProducts.forEach(async (product) => {
                        try {
                            const response = await fetch(`/api/products?id=${product.id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(product),
                            });

                            if (!response.ok) throw new Error('Error updating product');

                            // Actualizar el estado local
                            setProducts(prevProducts =>
                                prevProducts.map(p =>
                                    p.odooCode === product.odooCode ? product : p
                                )
                            );
                        } catch (error) {
                            console.error('Error updating product:', error);
                        }
                    });
                }

                // Crear nuevos productos
                if (newProducts.length > 0) {
                    setPreviewStockData(newProducts);
                }

                showNotification({
                    type: 'success',
                    title: 'Archivo procesado',
                    message: `Se actualizaron ${updatedProducts.length} productos y se encontraron ${newProducts.length} productos nuevos.`,
                    duration: 3000
                });

            } catch (error) {
                console.error('Error al procesar archivo:', error);
                showNotification({
                    type: 'error',
                    title: 'Error al procesar archivo',
                    message: 'Hubo un problema al procesar el archivo. Verifica que sea un archivo Excel válido.',
                    duration: 5000
                });
            }
        }
        reader.readAsBinaryString(file)
    }

    // Función para calcular la cantidad a fabricar
    const calculateProductionAmount = (current: number, min: number, max: number): number => {
        if (current <= min) {
            return max - current;
        }
        return 0;
    };

    // Función para determinar el estado del producto
    const getProductStatus = (item: Product) => {
        // const productionAmount = calculateProductionAmount(item.cantidad, item.minimum, item.maximum);
        // if (item.cantidad <= item.minimum) return 'needed';
        // if (item.cantidad >= item.maximum) return 'optimal';
        return 'medium';
    };

    // Función para filtrar los productos
    const filteredProducts = previewData
        .filter(item => item.odooName && item.odooName.trim() !== '') // Excluir productos sin nombre
        .filter(item => {
            if (filterStatus === 'all') return true;
            const status = getProductStatus(item);
            if (filterStatus === 'optimal') return status === 'optimal';
            if (filterStatus === 'needed') return status === 'needed';
            return true;
        });

    // Función para manejar el inicio de la edición de cantidad
    const handleStartEditingAmount = (productId: string, currentAmount: number) => {
        setEditingAmount(productId);
        setTempAmountValue(currentAmount.toString());
    };

    // Función para manejar cambios en la cantidad
    const handleAmountChange = (value: string) => {
        if (value === '') {
            setTempAmountValue(value);
            return;
        }
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 0) return;
        setTempAmountValue(value);
    };

    // Función para actualizar la cantidad
    const handleAmountUpdate = (productId: string) => {
        const numValue = parseInt(tempAmountValue);
        if (isNaN(numValue) || numValue < 0) {
            setEditingAmount(null);
            return;
        }

        setIsUpdatingAmount(productId);

        try {
            setCustomAmounts(prev => ({
                ...prev,
                [productId]: numValue
            }));
            showNotification({
                type: 'success',
                title: 'Cantidad actualizada',
                message: 'La cantidad a fabricar ha sido actualizada correctamente.',
                duration: 3000
            });
        } catch (error) {
            console.error('Error al actualizar la cantidad:', error);
            showNotification({
                type: 'error',
                title: 'Error',
                message: 'No se pudo actualizar la cantidad.',
                duration: 3000
            });
        } finally {
            setIsUpdatingAmount(null);
            setEditingAmount(null);
        }
    };

    // Función para eliminar un producto
    const handleDeleteProduct = (productId: string) => {
        setPreviewData(prev => prev.filter(item => item.odooCode !== productId));
        showNotification({
            type: 'success',
            title: 'Producto eliminado',
            message: 'El producto ha sido eliminado de la lista.',
            duration: 3000
        });
    };

    const handleCreateProduct = async () => {
        setIsLoading(true);
        if (file) {
            const p: Product[] = [];
            for (const product of previewData) {
                const res = await createProduct(product);
                if (res.ok) {
                    p.push(product);
                    // setProducts(prev => [...prev, product]);
                }
            }
            console.log(p);
            setProducts(p);
            showNotification({
                type: 'success',
                title: 'Productos Actualizados',
                message: 'Los productos han sido actualizados en el sistema.',
                duration: 3000
            });
        } else {
            showNotification({
                type: 'error',
                title: 'Error',
                message: 'No se pudo actualizar los productos del sistema.',
                duration: 3000
            });
        }
        setIsLoading(false);
    };

    const handleCreateProductFromStock = async () => {
        setIsLoading(true);
        console.log('Intentando crear productos...');
        if (stockFile) {
            for (const product of previewStockData) {
                console.log(product)
                const res = await createProduct(product);
                if (res.ok) {
                    setProducts(prev => [...prev, product]);
                }
            }
            showNotification({
                type: 'success',
                title: 'Productos Actualizados',
                message: 'Los productos han sido actualizados en el sistema.',
                duration: 3000
            });
        } else {
            showNotification({
                type: 'error',
                title: 'Error',
                message: 'No se pudo actualizar los productos del sistema.',
                duration: 3000
            });
        }
        setIsLoading(false);
    };

    // Modificar la función de filtrado para incluir cantidades personalizadas
    const getProductionAmount = (item: Product) => {
        if (customAmounts[item.odooCode] !== undefined) {
            return customAmounts[item.odooCode];
        }
        return calculateProductionAmount(item.cantidadInventario, item.minimum, item.maximum);
    };

    // Modificar el botón de copiar lista para usar getProductionAmount
    const handleCopyProductionList = () => {
        const today = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const productsToManufacture = products
            .filter(item =>
                item.category !== "JKY / Materias primas y materiales" &&
                // Verificar que tenga código
                item.odooCode &&
                getProductionAmount(item) > 0)
            .map(item => ({
                producto: item.odooName,
                cantidad: getProductionAmount(item),
                unidadMedida: item.unidadMedida
            }));

        if (productsToManufacture.length > 0) {
            // Crear la tabla con formato markdown
            const tableHeader = `*Plan de Producción: ${today}*\n\n` +
                `| *Producto* | *Cantidad* | *U/M* |\n` +
                `|---------------------------------|\n`;

            const tableRows = productsToManufacture
                .map(item => `| ${item.producto} | ${item.cantidad} | ${item.unidadMedida} |`)
                .join('\n');

            const fullTable = tableHeader + tableRows + '\n';

            navigator.clipboard.writeText(fullTable);
            showNotification({
                type: 'success',
                title: 'Lista copiada',
                message: 'La lista de producción ha sido copiada al portapapeles',
                duration: 3000
            });
        } else {
            showNotification({
                type: 'warning',
                title: 'Sin producción necesaria',
                message: 'No hay productos que requieran producción en este momento',
                duration: 3000
            });
        }
    };

    const handleDeleteAllProducts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/products', {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Error deleting products')
            else {
                setProducts([]);
            }
            showNotification({
                type: 'success',
                title: 'Productos eliminados',
                message: 'Todos los productos han sido eliminados de la base de datos.',
                duration: 3000,
            });
        } catch (error) {
            console.error('Error al eliminar productos:', error);
            showNotification({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron eliminar los productos.',
                duration: 3000,
            });
        }
        setIsLoading(false);
    };

    const handleCopyBuyList = () => {
        const today = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        console.log("Todos los productos:", products); // Debug: ver todos los productos

        // Filtrar productos que cumplan con los criterios
        const productsToBuy = products.filter(item => {
            return (
                item.category === "JKY / Materias primas y materiales" &&
                // Verificar que tenga código
                item.odooCode &&
                // Verificar que el código sea de 4 dígitos
                item.odooCode.length === 4 &&
                // Verificar que la cantidad en inventario sea menor que el mínimo
                item.cantidadInventario < item.minimum
            );
        }).map(item => ({
            producto: item.odooName,
            // Calcular cantidad a comprar (máximo - cantidad actual)
            cantidadComprar: Math.max(0, item.maximum - (item.cantidadInventario || 0)),
            unidadMedida: item.unidadMedida
        }));

        console.log("Productos a comprar:", productsToBuy);

        if (productsToBuy.length > 0) {
            // Crear la tabla con formato markdown
            const tableHeader = `*Pedido de Compra: ${today}*\n\n` +
                `| *Producto* | *Cantidad* | *U/M* |\n` +
                `|---------------------------------|\n`;

            const tableRows = productsToBuy
                .map(item =>
                    `| ${item.producto} | ${item.cantidadComprar.toFixed(2)} | ${item.unidadMedida} |`
                )
                .join('\n');

            const fullTable = tableHeader + tableRows + '\n';

            // Copiar al portapapeles
            navigator.clipboard.writeText(fullTable);

            showNotification({
                type: 'success',
                title: 'Lista copiada',
                message: 'La lista de compras ha sido copiada al portapapeles',
                duration: 3000
            });
        } else {
            showNotification({
                type: 'warning',
                title: 'Sin productos para comprar',
                message: 'No hay productos que requieran compra en este momento',
                duration: 3000
            });
        }
    };

    return (
        <div className="flex-1 space-y-4 md:pt-5 md:px-10">
            {isLoading && <LoadingOverlay />}
            <div className="flex items-center justify-start">
                <h2 className="text-3xl font-bold tracking-tight text-slate-200 ml-10">
                    Gestión de Productos
                </h2>
                <button
                    onClick={() => setShowHelp(true)}
                    className="flex items-center gap-1 px-3 ml-4 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                    title="Ayuda"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                        />
                    </svg>
                    <span>Ayuda</span>
                </button>
            </div>

            <div className="border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-lg p-6">
                <div className="flex flex-col gap-4">
                    {/* Sección de carga de archivo */}
                    <div className="p-4 border border-slate-600 rounded-lg bg-gray-800/50">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-sm flex flex-col items-center gap-2">
                                <h3 className="font-semibold text-slate-200">Cargar Archivo</h3>
                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="px-4 py-2 ml-6 mt-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Cargar o Actualizar Productos
                                </button>
                                <button
                                    onClick={() => setStockUpload(true)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Actualizar Stock de Odoo
                                </button>
                                <button
                                    onClick={() => {
                                        handleDeleteAllProducts();
                                    }}
                                    className="px-4 py-2 ml-6 bg-red-600 text-white rounded hover:bg-red-700"
                                    hidden={products.length === 0}
                                >
                                    Eliminar Todos los Productos
                                </button>
                            </div>
                            <div className="text-sm flex flex-col items-center gap-2">
                                <button
                                    onClick={handleCopyBuyList}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                    hidden={products.length === 0}
                                >
                                    Generar Pedido de Compra
                                </button>
                                <button
                                    onClick={handleCopyProductionList}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                    hidden={products.length === 0}
                                >
                                    Generar Plan de Producción
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Análisis de Producción */}
                    {/* {previewData.length > 0 && (
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-slate-200">Análisis de Producción</h3>
                            </div>
                            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-slate-700 text-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">Producto</th>
                                            <th className="px-6 py-3">Cantidad Actual</th>
                                            <th className="px-6 py-3">Mnimo</th>
                                            <th className="px-6 py-3">Máximo</th>
                                            <th className="px-6 py-3">Cantidad a Fabricar</th>
                                            <th className="px-6 py-3 flex items-center gap-2">Estado
                                                <select
                                                    value={filterStatus}
                                                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'optimal' | 'needed')}
                                                    className="px-4 py-2 rounded bg-slate-700 text-slate-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="all">Todos los estados</option>
                                                    <option value="optimal">Stock Óptimo</option>
                                                    <option value="needed">Necesita Producción</option>
                                                </select></th>
                                            <th className="px-6 py-3">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map((item, index) => {
                                            const productionAmount = getProductionAmount(item);

                                            return (
                                                <tr key={index} className="border-b border-slate-600 bg-slate-800/50 hover:bg-slate-700">
                                                    <td className="px-6 py-4 text-slate-200">
                                                        {item.producto}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-200">
                                                        {item.cantidad}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-200">
                                                        {item.minimum}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-200">
                                                        {item.maximum}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {editingAmount === item.codigo ? (
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    className="w-20 px-2 py-1 text-black rounded"
                                                                    value={tempAmountValue}
                                                                    onChange={(e) => handleAmountChange(e.target.value)}
                                                                    onBlur={() => handleAmountUpdate(item.codigo)}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleAmountUpdate(item.codigo);
                                                                        }
                                                                    }}
                                                                    onFocus={(e) => e.target.select()}
                                                                    autoFocus
                                                                />
                                                                {isUpdatingAmount === item.codigo && (
                                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div
                                                                onClick={() => handleStartEditingAmount(item.codigo, productionAmount)}
                                                                className="cursor-pointer hover:bg-gray-700 px-2 py-1 rounded flex items-center gap-2"
                                                            >
                                                                <span className={productionAmount > 0 ? 'text-yellow-500' : 'text-green-500'}>
                                                                    {productionAmount > 0 ? productionAmount : '-'}
                                                                </span>
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={1.5}
                                                                    stroke="currentColor"
                                                                    className="w-4 h-4 text-gray-400 hover:text-blue-400"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.cantidad <= item.minimum
                                                            ? 'bg-red-500/10 text-red-500'
                                                            : item.cantidad >= item.maximum
                                                                ? 'bg-green-500/10 text-green-500'
                                                                : 'bg-yellow-500/10 text-yellow-500'
                                                            }`}>
                                                            {item.cantidad <= item.minimum
                                                                ? 'Producción Necesaria'
                                                                : item.cantidad >= item.maximum
                                                                    ? 'Stock Óptimo'
                                                                    : 'Stock Medio'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => handleDeleteProduct(item.codigo)}
                                                            className="text-red-500 hover:text-red-600"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-5 w-5"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div> */}

                    {/* Botón para exportar resultados */}
                    {/* <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleCopyProductionList}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    Copiar Lista de Producción
                                </button>
                            </div>
                        </div>
                    )} */}
                    {products.length > 0 && (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs uppercase bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3">Código</th>
                                        <th className="px-6 py-3">Nombre</th>
                                        <th className="px-6 py-3">Cant.</th>
                                        <th className="px-6 py-3">U/M</th>
                                        <th className="px-6 py-3">Mínimo</th>
                                        <th className="px-6 py-3">Máximo</th>
                                        <th className="px-6 py-3">Categoría</th>
                                        <th className="px-6 py-3">Fabricable</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-700 text-center">
                                            <td className="px-2 py-4">{item.odooCode}</td>
                                            <td className="px-10 py-4 text-left font-semibold">{item.odooName}</td>
                                            <td className="px-2 py-4">{item.cantidadInventario}</td>
                                            <td className="px-2 py-4">{item.unidadMedida}</td>
                                            <td className="px-1 py-4">{item.minimum}</td>
                                            <td className="px-1 py-4">{item.maximum}</td>
                                            <td className="px-3 py-4">{item.category}</td>
                                            <td className="px-1 py-4">
                                                {item.fabricable ? (
                                                    <span className="flex items-center text-green-500">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 112 0v4a1 1 0 11-2 0V7zm0 6a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                                        </svg>
                                                        Fabricable
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-red-500">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 112 0v4a1 1 0 11-2 0V7zm0 6a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                                        </svg>
                                                        No fabricable
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal de carga */}
                <Transition appear show={showUpload} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={() => setShowUpload(false)}>
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
                                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white mb-4">
                                        Cargar Excel con Productos
                                    </Dialog.Title>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 bg-slate-700 p-2 rounded">
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        processFile(file);
                                                        setFile(file);
                                                    }
                                                }}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                            {file && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setFile(null);
                                                            setPreviewData([]);
                                                            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                                            if (input) {
                                                                input.value = '';
                                                            }
                                                        }}
                                                        className="p-1 bg-red-500 rounded-full hover:bg-red-600"
                                                    >
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {previewData.length > 0 && (
                                            <button
                                                onClick={() => setShowPreview(!showPreview)}
                                                className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-2"
                                            >
                                                {showPreview ? '▼ Ocultar' : '▶ Mostrar'} vista previa
                                            </button>
                                        )}

                                        {showPreview && previewData.length > 0 && (
                                            <div className="mt-4 overflow-x-auto">
                                                <table className="w-full text-sm text-left text-gray-300">
                                                    <thead className="text-xs uppercase bg-gray-700">
                                                        <tr>
                                                            <th className="px-6 py-3">Código</th>
                                                            <th className="px-6 py-3">Nombre</th>
                                                            <th className="px-6 py-3">U/M</th>
                                                            <th className="px-6 py-3">Mínimo</th>
                                                            <th className="px-6 py-3">Máximo</th>
                                                            <th className="px-6 py-3">Categoría</th>
                                                            <th className="px-6 py-3">Fabricable</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {previewData.map((item, index) => (
                                                            <tr key={index} className="border-b border-gray-700 text-center">
                                                                <td className="px-2 py-4">{item.odooCode}</td>
                                                                <td className="px-10 py-4 text-left font-semibold">{item.odooName}</td>
                                                                <td className="px-2 py-4">{item.unidadMedida}</td>
                                                                <td className="px-1 py-4">{item.minimum}</td>
                                                                <td className="px-1 py-4">{item.maximum}</td>
                                                                <td className="px-3 py-4">{item.category}</td>
                                                                <td className="px-1 py-4">{item.fabricable.toString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setPreviewData([]);
                                                setFile(null);
                                                setShowUpload(false)
                                                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                                if (input) {
                                                    input.value = '';
                                                }
                                            }}
                                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (previewData.length > 0) {
                                                    handleCreateProduct();
                                                    setShowUpload(false)
                                                }
                                            }}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            disabled={!file}
                                        >
                                            Confirmar
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
                <Transition appear show={stockUpload} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={() => setStockUpload(false)}>
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
                                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white mb-4">
                                        Cargar Excel con Stock de Inventario de Odoo
                                    </Dialog.Title>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 bg-slate-700 p-2 rounded">
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        processStockFile(file);
                                                        setStockFile(file);
                                                    }
                                                }}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                            {stockFile && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setStockFile(null);
                                                            setPreviewStockData([]);
                                                            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                                            if (input) {
                                                                input.value = '';
                                                            }
                                                        }}
                                                        className="p-1 bg-red-500 rounded-full hover:bg-red-600"
                                                    >
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {previewStockData.length > 0 && (
                                            <button
                                                onClick={() => setShowStockPreview(!showStockPreview)}
                                                className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-2"
                                            >
                                                {showStockPreview ? '▼ Ocultar' : '▶ Mostrar'} vista previa
                                            </button>
                                        )}

                                        {showStockPreview && previewStockData.length > 0 && (
                                            <div className="mt-4 overflow-x-auto">
                                                <table className="w-full text-sm text-left text-gray-300">
                                                    <thead className="text-xs uppercase bg-gray-700">
                                                        <tr>
                                                            <th className="px-6 py-3">Código</th>
                                                            <th className="px-6 py-3">Nombre</th>
                                                            <th className="px-6 py-3">Cantidad</th>
                                                            <th className="px-6 py-3">U/M</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {previewStockData.map((item, index) => (
                                                            <tr key={index} className="border-b border-gray-700 text-center">
                                                                <td className="px-2 py-4">{item.odooCode}</td>
                                                                <td className="px-10 py-4 text-left font-semibold">{item.odooName}</td>
                                                                <td className="px-1 py-4">{item.cantidadInventario}</td>
                                                                <td className="px-2 py-4">{item.unidadMedida}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setStockUpload(false)
                                                setStockFile(null);
                                                setPreviewStockData([]);
                                                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                                if (input) {
                                                    input.value = '';
                                                }
                                            }}
                                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (previewStockData.length > 0) {
                                                    handleCreateProductFromStock()
                                                }
                                                setStockUpload(false)
                                            }}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            disabled={!stockFile}
                                        >
                                            Confirmar
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
                <Transition appear show={showHelp} as={Fragment}>
                    <Dialog as="div" className="relative z-50" onClose={() => setShowHelp(false)}>
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
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <Dialog.Title as="h3" className="text-lg font-medium text-white">
                                                📚 Guía de Usuario
                                            </Dialog.Title>
                                            <button
                                                onClick={() => setShowHelp(false)}
                                                className="text-gray-400 hover:text-white"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="mt-2 prose prose-invert max-h-[70vh] overflow-y-auto">
                                            <div className="space-y-6 text-gray-300">
                                                <section>
                                                    <h2 className="text-xl font-bold text-white">🎯 Descripción</h2>
                                                    <p>Esta aplicación permite gestionar el inventario de productos, controlar stocks mínimos y máximos, y generar automáticamente pedidos de compra y planes de producción basados en el inventario actual.</p>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-bold text-white">🔄 Funciones Principales</h2>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h3 className="text-lg font-semibold">📥 Cargar o Actualizar Productos</h3>
                                                            <p className="text-sm text-gray-400">Permite cargar la lista maestra de productos con sus parámetros básicos</p>
                                                            <p className="text-sm text-gray-400 mt-1">Columnas requeridas:</p>
                                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                                <li><code>Código de barras</code>: Identificador único del producto</li>
                                                                <li><code>Nombre</code>: Nombre completo del producto</li>
                                                                <li><code>Unidad de medida</code>: Unidad de medida del producto</li>
                                                                <li><code>Abasteciendo cant. min.</code>: Stock mínimo permitido</li>
                                                                <li><code>Abasteciendo cant. max.</code>: Stock máximo deseado</li>
                                                                <li><code>Categoría interna</code>: Categoría del producto</li>
                                                                <li><code>Lista de materiales/Activo</code>: Indica si es fabricable (true/false)</li>
                                                            </ul>
                                                            <h2 className="font-semibold">Indicaciones:</h2>
                                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                                <li><code>Abrir apartado de Productos</code></li>
                                                                <li><code>Ordenar Productos a modo de lista en el icono en la parte superior derecha, debajo
                                                                    de la barra de búsqueda, exactamente debajo de la lupa</code></li>
                                                                <li><code>Cambia cantidad de productos que se muestran en pantalla, dando doble click en el número 80 y cambiándolo
                                                                    por la cantidad total a su derecha. Ejemplo Antes: 1-80/2340 ... Después 1-2340/2340</code></li>
                                                                <li><code>Seleccionar en la casilla a la izquierda en la parte superior la casilla para seleccionar todos los productos,
                                                                    la casilla que esta justo debajo del botón CREAR</code></li>
                                                                <li><code>Luego, dar en el botón de exportar que se encuentra en la parte superior central</code></li>
                                                                <li><code>Exportar reporte seleccionando la Plantilla ¨Pedro Sistema Informatico¨</code></li>
                                                                <li><code>Importar en el Sistema</code></li>
                                                            </ul>
                                                        </div>

                                                        <div>
                                                            <h3 className="text-lg font-semibold">📊 Actualizar Stock de Odoo</h3>
                                                            <p className="text-sm text-gray-400">Actualiza las cantidades en inventario desde Odoo</p>
                                                            <p className="text-sm text-gray-400 mt-1">Columnas requeridas:</p>
                                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                                <li><code>Producto/Código de barras</code>: Identificador del producto</li>
                                                                <li><code>Producto</code>: Nombre del producto</li>
                                                                <li><code>Cantidad</code>: Cantidad actual en inventario</li>
                                                                <li><code>Unidad de medida</code>: Unidad de medida</li>
                                                                <li><code>Producto/Categoría interna</code>: Categoría del producto</li>
                                                                <li><code>Producto/ Abasteciendo cant. min.</code>: Stock mínimo</li>
                                                                <li><code>Producto/ Abasteciendo cant. max.</code>: Stock máximo</li>
                                                                <li><code>Producto/Lista de materiales/Activo</code>: Indica si es fabricable</li>
                                                            </ul>
                                                            <h2 className="font-semibold">Indicaciones:</h2>
                                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                                <li><code>Abrir apartado de Informes de Inventario en Informes</code></li>
                                                                <li><code>Agrupar Por Ubicación la disponibilidad de los productos</code></li>
                                                                <li><code>Desplegar las ubicaciones de Centro de Elaboración y Frank País expandiendo las cantidades a mostrar de productos(Ejemplo Antes: 1-80/2340 ... Después 1-2340/2340)</code></li>
                                                                <li><code>Seleccionar en la casilla a la izquierda en la parte superior la casilla para seleccionar todos los productos,
                                                                    la casilla que esta justo debajo del botón CREAR</code></li>
                                                                <li><code>Luego, dar en el botón de exportar que se encuentra en la parte superior central</code></li>
                                                                <li><code>Exportar reporte seleccionando la Plantilla ¨Sistema CE-FP</code></li>
                                                                <li><code>Importar en el Sistema</code></li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-bold text-white">🛠️ Funciones de Gestión</h2>
                                                    <p className="text-sm text-gray-400"><code>NOTA: </code>Ambos se copian automáticamente al portapapeles.</p>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h3 className="text-lg font-semibold">📝 Generar Pedido de Compra</h3>
                                                            <p className="text-sm text-gray-400">Genera una lista de productos que necesitan ser comprados cuando:</p>
                                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                                <li>La cantidad en inventario es menor al mínimo establecido</li>
                                                                <li>La cantidad a pedir será la necesaria para alcanzar el máximo</li>
                                                            </ul>
                                                        </div>

                                                        <div>
                                                            <h3 className="text-lg font-semibold">🏭 Generar Plan de Producción</h3>
                                                            <p className="text-sm text-gray-400">Crea una lista de productos que necesitan ser fabricados cuando:</p>
                                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                                <li>El producto está marcado como fabricable</li>
                                                                <li>La cantidad en inventario es menor al mínimo establecido</li>
                                                                <li>La cantidad a fabricar será la necesaria para alcanzar el máximo</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-bold text-white">⚠️ Importante</h2>
                                                    <ul className="list-disc pl-5 space-y-2">
                                                        <li className="text-yellow-400">Los nombres de las columnas en los archivos Excel deben ser <strong>exactamente iguales</strong> a los especificados</li>
                                                        <li>Verifica los datos en la vista previa antes de confirmar cualquier operación</li>
                                                        <li>Los productos se identifican por su código de barras, asegúrate de que sean correctos</li>
                                                        <li>Las cantidades mínimas y máximas determinan cuándo se generan las alertas de compra/producción</li>
                                                    </ul>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-bold text-white">💡 Consejos</h2>
                                                    <ul className="list-disc pl-5 space-y-2">
                                                        <li>Actualiza el stock regularmente para mantener la información precisa</li>
                                                        <li>Revisa las cantidades mínimas y máximas periódicamente</li>
                                                        <li>Utiliza la vista previa para verificar los datos antes de cargarlos</li>
                                                        <li>Mantén un respaldo de tus archivos de Excel</li>
                                                    </ul>
                                                </section>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex justify-end">
                                            <button
                                                type="button"
                                                className="px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none"
                                                onClick={() => setShowHelp(false)}
                                            >
                                                Entendido
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </div>
        </div >
    )
}
