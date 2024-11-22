"use client"

import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import * as XLSX from 'xlsx'
import { showNotification } from '@/components/Notification'

interface PlanTrabajoData {
    codigo: string
    producto: string
    unidad: string
    cantidad: number
    minimo: number
    maximo: number
}

export function PlanTrabajo() {
    const [showUpload, setShowUpload] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<PlanTrabajoData[]>([])
    const [showPreview, setShowPreview] = useState(false)
    const [filterStatus, setFilterStatus] = useState<'all' | 'optimal' | 'needed'>('all');
    const [editingAmount, setEditingAmount] = useState<string | null>(null);
    const [tempAmountValue, setTempAmountValue] = useState<string>('');
    const [isUpdatingAmount, setIsUpdatingAmount] = useState<string | null>(null);
    const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});

    const validateFileStructure = (jsonData: any[]) => {
        const requiredColumns = [
            'Producto/Código de barras',
            'Producto',
            'Unidad de medida',
            'Cantidad disponible',
            'Producto/ Abasteciendo cant. min.',
            'Producto/ Abasteciendo cant. max.'
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

                const processedData = jsonData.reduce((acc: PlanTrabajoData[], row: any) => {
                    if (!('Producto/Código de barras' in row && 'Cantidad disponible' in row)) {
                        return acc
                    }

                    const existingProduct = acc.find(p => p.codigo === row['Producto/Código de barras'])

                    if (existingProduct) {
                        existingProduct.cantidad += Number(row['Cantidad disponible'] || 0)
                    } else {
                        acc.push({
                            codigo: row['Producto/Código de barras'],
                            producto: row['Producto'],
                            unidad: row['Unidad de medida'],
                            cantidad: Number(row['Cantidad disponible'] || 0),
                            minimo: Number(row['Producto/ Abasteciendo cant. min.'] || 0),
                            maximo: Number(row['Producto/ Abasteciendo cant. max.'] || 0)
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

    // Función para calcular la cantidad a fabricar
    const calculateProductionAmount = (current: number, min: number, max: number): number => {
        if (current <= min) {
            return max - current;
        }
        return 0;
    };

    // Función para determinar el estado del producto
    const getProductStatus = (item: PlanTrabajoData) => {
        const productionAmount = calculateProductionAmount(item.cantidad, item.minimo, item.maximo);
        if (item.cantidad <= item.minimo) return 'needed';
        if (item.cantidad >= item.maximo) return 'optimal';
        return 'medium';
    };

    // Función para filtrar los productos
    const filteredProducts = previewData
        .filter(item => item.producto && item.producto.trim() !== '') // Excluir productos sin nombre
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
        setPreviewData(prev => prev.filter(item => item.codigo !== productId));
        showNotification({
            type: 'success',
            title: 'Producto eliminado',
            message: 'El producto ha sido eliminado de la lista.',
            duration: 3000
        });
    };

    // Modificar la función de filtrado para incluir cantidades personalizadas
    const getProductionAmount = (item: PlanTrabajoData) => {
        if (customAmounts[item.codigo] !== undefined) {
            return customAmounts[item.codigo];
        }
        return calculateProductionAmount(item.cantidad, item.minimo, item.maximo);
    };

    // Modificar el botón de copiar lista para usar getProductionAmount
    const handleCopyProductionList = () => {
        const today = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const productsToManufacture = filteredProducts
            .filter(item => getProductionAmount(item) > 0)
            .map(item => ({
                producto: item.producto,
                cantidad: getProductionAmount(item)
            }));

        if (productsToManufacture.length > 0) {
            // Crear la tabla con formato markdown
            const tableHeader = `*Plan de Trabajo: ${today}*\n\n` +
                `| Producto | Cantidad a Fabricar |\n` +
                `---------------------------------\n`;

            const tableRows = productsToManufacture
                .map(item => `| ${item.producto} | ${item.cantidad} |`)
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

    return (
        <div className="flex-1 space-y-4 md:pt-5 md:px-10">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-slate-200 ml-10">
                    Plan de Trabajo
                </h2>
            </div>
            <div className="border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-lg p-6">
                <div className="flex flex-col gap-4">
                    {/* Sección de carga de archivo */}
                    <div className="p-4 border border-slate-600 rounded-lg bg-gray-800/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-slate-200">Datos del Plan</h3>
                            <button
                                onClick={() => setShowUpload(true)}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Cargar Plan de Trabajo
                            </button>
                        </div>

                        {/* Feedback del estado de carga */}
                        <div className="text-sm">
                            <span className={`font-medium ${file ? 'text-green-500' : 'text-yellow-500'}`}>
                                {file
                                    ? `✓ Archivo cargado: ${file.name}`
                                    : '⚠ No hay datos cargados'}
                            </span>
                        </div>
                    </div>

                    {/* Tabla de Análisis de Producción */}
                    {previewData.length > 0 && (
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
                                            <th className="px-6 py-3">Mínimo</th>
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
                                                        {item.minimo}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-200">
                                                        {item.maximo}
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
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.cantidad <= item.minimo
                                                            ? 'bg-red-500/10 text-red-500'
                                                            : item.cantidad >= item.maximo
                                                                ? 'bg-green-500/10 text-green-500'
                                                                : 'bg-yellow-500/10 text-yellow-500'
                                                            }`}>
                                                            {item.cantidad <= item.minimo
                                                                ? 'Producción Necesaria'
                                                                : item.cantidad >= item.maximo
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
                            </div>

                            {/* Botón para exportar resultados */}
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleCopyProductionList}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    Copiar Lista de Producción
                                </button>
                            </div>
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
                                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white mb-4">
                                        Cargar Plan de Trabajo
                                    </Dialog.Title>

                                    <div className="space-y-4">
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) processFile(file)
                                            }}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />

                                        {file && (
                                            <div className="flex items-center gap-2 bg-slate-700 p-2 rounded">
                                                <span className="text-white">{file.name}</span>
                                                <button
                                                    onClick={() => {
                                                        setFile(null)
                                                        setPreviewData([])
                                                    }}
                                                    className="p-1 bg-red-500 rounded-full hover:bg-red-600"
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}

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
                                                            <th className="px-6 py-3">Producto</th>
                                                            <th className="px-6 py-3">Unidad</th>
                                                            <th className="px-6 py-3">Cantidad</th>
                                                            <th className="px-6 py-3">Mínimo</th>
                                                            <th className="px-6 py-3">Máximo</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {previewData.map((item, index) => (
                                                            <tr key={index} className="border-b border-gray-700">
                                                                <td className="px-6 py-4">{item.codigo}</td>
                                                                <td className="px-6 py-4">{item.producto}</td>
                                                                <td className="px-6 py-4">{item.unidad}</td>
                                                                <td className="px-6 py-4">{item.cantidad}</td>
                                                                <td className="px-6 py-4">{item.minimo}</td>
                                                                <td className="px-6 py-4">{item.maximo}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => setShowUpload(false)}
                                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (previewData.length > 0) {
                                                    // Aquí puedes agregar la lógica para procesar los datos
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
            </div>
        </div>
    )
}
