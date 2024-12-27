// "use client";

// import { useState, useEffect, Fragment } from 'react';
// import * as XLSX from 'xlsx';
// import { Dialog, Transition } from '@headlessui/react';
// import { fetchTemplate, updateTemplate, deleteTemplate } from '../utils/templateManager';
// import { showNotification } from './Notification';
// import { ConfirmDialog } from './ConfirmDialog';

// interface Product {
//     tambiaCode: string;    // Código TuAmbia
//     odooCode: string;      // Código Odoo
//     tambiaName: string;    // Nombre TuAmbia
//     odooName: string;      // Nombre Odoo
//     category: string;      // Categoría
//     visible: boolean;      // Visible
//     reservePercentage: number; // Porcentaje de reserva
// }

// interface InventoryTemplate {
//     updatedAt: string;
//     id: string;
//     name: string;
//     products: Product[];
// }

// interface InventoryData {
//     odooStock: number;
//     tambiaAvailable: number;
//     tambiaSold: number;
//     othersReserved: number;
// }

// interface TemplateUploadProps {
//     onTemplateLoad: (template: InventoryTemplate | null) => void;
//     inventoryData?: Map<string, InventoryData>;
// }

// export default function TemplateUpload({ onTemplateLoad, inventoryData = new Map() }: TemplateUploadProps) {
//     const [template, setTemplate] = useState<InventoryTemplate | null>(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [showTemplateUpload, setShowTemplateUpload] = useState(false);
//     const [showHelp, setShowHelp] = useState(false);
//     const [lastUpdate, setLastUpdate] = useState<string | null>(null);
//     const [editingReserve, setEditingReserve] = useState<string | null>(null);
//     const [tempReserveValue, setTempReserveValue] = useState<string>('');
//     const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//     const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
//     const [isUpdatingReserve, setIsUpdatingReserve] = useState<string | null>(null);

//     useEffect(() => {
//         const loadTemplate = async () => {
//             setIsLoadingTemplate(true);
//             try {
//                 const template = await fetchTemplate();
//                 setTemplate(template);
//                 onTemplateLoad(template);
//             } catch (error) {
//                 console.error('Error al cargar la plantilla:', error);
//             } finally {
//                 setIsLoadingTemplate(false);
//             }
//         };

//         loadTemplate();
//     }, []);

//     const processTemplateFile = async (file: File) => {
//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary" });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const jsonData = XLSX.utils.sheet_to_json(worksheet);

//                 if (!validateTemplateStructure(jsonData[0])) {
//                     showNotification({
//                         type: 'error',
//                         title: 'Error en la estructura del archivo',
//                         message: `El archivo no tiene el formato correcto. Por favor, verifica que contenga todas las columnas requeridas:
//                             <br>• Código TuAmbia
//                             <br>• Código Odoo
//                             <br>• Nombre TuAmbia
//                             <br>• Nombre Odoo
//                             <br>• Categoría
//                             <br>• Visible`,
//                         duration: 15000 // 15 segundos para este mensaje importante
//                     });
//                     return;
//                 }

//                 const newTemplate: InventoryTemplate = {
//                     id: "general",
//                     name: "Plantilla General",
//                     updatedAt: new Date().toISOString(),
//                     products: jsonData.map((row: any) => ({
//                         tambiaCode: row['Código TuAmbia']?.toString() || null,
//                         odooCode: row['Código Odoo']?.toString() || '',
//                         tambiaName: row['Nombre TuAmbia'] || null,
//                         odooName: row['Nombre Odoo'] || '',
//                         category: row['Categoría'] || '',
//                         visible: row['Visible']?.toLowerCase() === 'si',
//                         reservePercentage: 75
//                     }))
//                 };

//                 await updateTemplate(newTemplate);
//                 setTemplate(newTemplate);
//                 onTemplateLoad(newTemplate);
//                 showNotification({
//                     type: 'success',
//                     title: 'Plantilla actualizada',
//                     message: 'La plantilla se ha actualizado exitosamente.'
//                 });
//             } catch (error) {
//                 console.error('Error al procesar el archivo:', error);
//                 showNotification({
//                     type: 'error',
//                     title: 'Error al procesar el archivo',
//                     message: 'Ha ocurrido un error al procesar el archivo. Por favor, verifica que sea un archivo Excel válido y vuelve a intentarlo.'
//                 });
//             }
//         };
//         reader.readAsBinaryString(file);
//     };

//     const validateTemplateStructure = (row: any) => {
//         const requiredColumns = [
//             'Código TuAmbia',
//             'Código Odoo',
//             'Nombre TuAmbia',
//             'Nombre Odoo',
//             'Categoría',
//             'Visible'
//         ];

//         return requiredColumns.every(column => column in row);
//     };

//     const updateProductPercentage = (index: number, newPercentage: number) => {
//         if (template && newPercentage >= 0 && newPercentage <= 100) {
//             const updatedTemplate = {
//                 ...template,
//                 products: template.products.map((product, i) =>
//                     i === index
//                         ? { ...product, reservePercentage: newPercentage }
//                         : product
//                 )
//             };
//             setTemplate(updatedTemplate);
//             updateTemplate(updatedTemplate);
//         }
//     };

//     const handleDeleteTemplate = async () => {
//         setShowDeleteConfirm(true);
//     };

//     const confirmDelete = async () => {
//         try {
//             setIsLoading(true);
//             await deleteTemplate();
//             setTemplate(null);
//             onTemplateLoad(null);
//             showNotification({
//                 type: 'success',
//                 title: 'Plantilla eliminada',
//                 message: 'La plantilla ha sido eliminada exitosamente del sistema.',
//                 duration: 5000
//             });
//         } catch (error) {
//             console.error('Error al eliminar la plantilla:', error);
//             showNotification({
//                 type: 'error',
//                 title: 'Error al eliminar',
//                 message: 'No se pudo eliminar la plantilla. Por favor, inténtalo de nuevo.',
//                 duration: 5000
//             });
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleStartEditing = (odooCode: string, currentValue: number) => {
//         setEditingReserve(odooCode);
//         setTempReserveValue(currentValue.toString());
//     };

//     const handleReserveChange = (value: string) => {
//         setTempReserveValue(value);
//     };

//     const handleReserveUpdate = async (odooCode: string) => {
//         const numValue = parseInt(tempReserveValue);
//         if (isNaN(numValue) || numValue < 0 || numValue > 100) {
//             setEditingReserve(null);
//             return;
//         }

//         setIsUpdatingReserve(odooCode);
        
//         try {
//             if (template) {
//                 const newTemplate = {
//                     ...template,
//                     products: template.products.map(product => {
//                         if (product.odooCode === odooCode) {
//                             return { ...product, reservePercentage: numValue };
//                         }
//                         return product;
//                     })
//                 };
//                 await updateTemplate(newTemplate);
//                 setTemplate(newTemplate);
//                 onTemplateLoad(newTemplate);
//             }
//         } catch (error) {
//             console.error('Error al actualizar el porcentaje:', error);
//         } finally {
//             setIsUpdatingReserve(null);
//             setEditingReserve(null);
//         }
//     };

//     if (isLoadingTemplate) return (
//         <div className="space-y-6">
//             <div className="flex items-center justify-center min-h-[60vh]">
//                 <div className="text-center space-y-4">
//                     <div className="relative flex justify-center">
//                         <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
//                         <div className="w-16 h-16 border-t-4 border-b-4 border-blue-300 rounded-full animate-spin absolute top-0" style={{ animationDirection: 'reverse', opacity: 0.7 }}></div>
//                     </div>
//                     <div className="text-xl font-semibold text-blue-500">Cargando plantilla...</div>
//                     <div className="text-sm text-slate-400">Por favor espere mientras se cargan los datos</div>
//                 </div>
//             </div>
//         </div>
//     );
//     if (error) return <div>Error: {error}</div>;

//     console.log('Current template:', template);

//     return (
//         <div className="py-8 space-y-8">
//             {/* Estado de la plantilla */}
//             <div className="flex flex-col gap-4">
//                 <div className="flex justify-between items-center">
//                     <div>
//                         <span className={`font-medium ${template ? 'text-green-500' : 'text-yellow-500'}`}>
//                             {template
//                                 ? '✓ Plantilla cargada en el sistema'
//                                 : '⚠ No hay plantilla cargada - Por favor, carga una plantilla'}
//                         </span>
//                         {template && (
//                             <p className="text-sm text-gray-400 mt-1">
//                                 Última actualización: {new Date(template.updatedAt).toLocaleString()}
//                             </p>
//                         )}
//                     </div>
//                     {template && (
//                         <button
//                             onClick={handleDeleteTemplate}
//                             disabled={isLoading}
//                             className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
//                         >
//                             {isLoading ? 'Eliminando...' : 'Eliminar Plantilla'}
//                         </button>
//                     )}
//                 </div>

//                 {/* Sección de carga de archivo siempre visible */}
//                 <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
//                     <h3 className="text-lg font-medium text-white mb-4">Cargar Nueva Plantilla</h3>
//                     <input
//                         type="file"
//                         accept=".xlsx,.xls"
//                         onChange={(e) => {
//                             const file = e.target.files?.[0];
//                             if (file) processTemplateFile(file);
//                         }}
//                         className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
//                                  file:rounded-full file:border-0 file:text-sm file:font-semibold 
//                                  file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                     />
//                     <p className="mt-2 text-sm text-gray-400">
//                         Selecciona un archivo Excel con la estructura requerida para la plantilla.
//                     </p>
//                 </div>
//             </div>

//             {/* Tabla de productos (si existe la plantilla) */}
//             {template && template.products && template.products.length > 0 ? (
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-sm text-left text-gray-300">
//                         <thead className="text-xs uppercase bg-gray-700">
//                             <tr>
//                                 <th className="px-6 py-3">Código TuAmbia</th>
//                                 <th className="px-6 py-3">Código Odoo</th>
//                                 <th className="px-6 py-3">Nombre TuAmbia</th>
//                                 <th className="px-6 py-3">Nombre Odoo</th>
//                                 <th className="px-6 py-3">Categoría</th>
//                                 <th className="px-6 py-3">Visible</th>
//                                 <th className="px-6 py-3">% Reserva</th>
//                                 <th className="px-6 py-3">Stock Odoo</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {template.products.map((product, index) => {
//                                 const data = inventoryData.get(product.odooCode) || {
//                                     odooStock: 0,
//                                     tambiaAvailable: 0,
//                                     tambiaSold: 0,
//                                     othersReserved: 0
//                                 };
//                                 return (
//                                     <tr key={index} className="bg-slate-800 text-slate-300 border-b border-slate-500 hover:bg-slate-700">
//                                         <td className="px-6 py-4">{product.tambiaCode}</td>
//                                         <td className="px-6 py-4">{product.odooCode}</td>
//                                         <td className="px-6 py-4">{product.tambiaName}</td>
//                                         <td className="px-6 py-4">{product.odooName}</td>
//                                         <td className="px-6 py-4">{product.category}</td>
//                                         <td className="px-6 py-4">
//                                             <div className="flex items-center">
//                                                 <input
//                                                     type="checkbox"
//                                                     checked={product.visible}
//                                                     onChange={(e) => {
//                                                         const updatedTemplate = {
//                                                             ...template,
//                                                             products: template.products.map((p, i) =>
//                                                                 i === index ? { ...p, visible: e.target.checked } : p
//                                                             )
//                                                         };
//                                                         setTemplate(updatedTemplate);
//                                                         updateTemplate(updatedTemplate);
//                                                     }}
//                                                     className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500"
//                                                 />
//                                                 <span className="ml-2">{product.visible ? 'Sí' : 'No'}</span>
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4">
//                                             {editingReserve === product.odooCode ? (
//                                                 <div className="relative">
//                                                     <input
//                                                         type="text"
//                                                         className="w-20 px-2 py-1 text-black rounded"
//                                                         value={tempReserveValue}
//                                                         onChange={(e) => handleReserveChange(e.target.value)}
//                                                         onBlur={() => handleReserveUpdate(product.odooCode)}
//                                                         onKeyPress={(e) => {
//                                                             if (e.key === 'Enter') {
//                                                                 handleReserveUpdate(product.odooCode);
//                                                             }
//                                                         }}
//                                                         onFocus={(e) => e.target.select()}
//                                                     />
//                                                     {isUpdatingReserve === product.odooCode && (
//                                                         <div className="absolute inset-y-0 right-0 flex items-center pr-2">
//                                                             <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             ) : (
//                                                 <div
//                                                     onClick={() => handleStartEditing(product.odooCode, product.reservePercentage)}
//                                                     className="cursor-pointer hover:bg-gray-700 px-2 py-1 rounded flex items-center gap-2"
//                                                 >
//                                                     <span>{product.reservePercentage}%</span>
//                                                     <svg
//                                                         xmlns="http://www.w3.org/2000/svg"
//                                                         fill="none"
//                                                         viewBox="0 0 24 24"
//                                                         strokeWidth={1.5}
//                                                         stroke="currentColor"
//                                                         className="w-4 h-4 text-gray-400 hover:text-blue-400"
//                                                     >
//                                                         <path
//                                                             strokeLinecap="round"
//                                                             strokeLinejoin="round"
//                                                             d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
//                                                         />
//                                                     </svg>
//                                                 </div>
//                                             )}
//                                         </td>
//                                         <td className="px-6 py-4">{data.odooStock}</td>
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             ) : (
//                 <div className="text-center text-gray-400 py-8">
//                     No hay productos en la plantilla
//                 </div>
//             )}

//             <ConfirmDialog
//                 isOpen={showDeleteConfirm}
//                 onClose={() => setShowDeleteConfirm(false)}
//                 onConfirm={confirmDelete}
//                 title="Eliminar Plantilla"
//                 message="¿Estás seguro de que deseas eliminar la plantilla? Esta acción no se puede deshacer."
//                 confirmText="Sí, eliminar"
//                 cancelText="Cancelar"
//                 type="danger"
//             />
//         </div>
//     );
// } 