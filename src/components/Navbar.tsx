"use client";

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface NavbarProps {
    showTemplateUpload: boolean;
    onToggleTemplate: () => void;
    hasTemplate: boolean;
}

export default function Navbar({ showTemplateUpload, onToggleTemplate, hasTemplate }: NavbarProps) {
    const [showHelp, setShowHelp] = useState(false);
    console.log(hasTemplate);

    return (
        <nav className="bg-gray-800 border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <h1 className="text-xl font-bold text-white">
                            {showTemplateUpload ? 'Gestión de Plantilla' : 'Gestión de Inventario'}
                        </h1>
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
                    {(showTemplateUpload || hasTemplate) && (
                        <div>
                            <button
                                onClick={onToggleTemplate}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                {showTemplateUpload ? 'Volver a Inventario' : 'Gestionar Plantilla'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Ayuda */}
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
                                                <p>Esta aplicación permite gestionar y sincronizar el inventario entre TuAmbia y Odoo, controlando las reservas de stock para diferentes canales de venta.</p>
                                            </section>

                                            <section>
                                                <h2 className="text-xl font-bold text-white">📑 Archivos Necesarios</h2>
                                                <div className="space-y-6">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">1. 📌 Plantilla de Productos</h3>
                                                        <p className="text-sm text-gray-400 mb-2">Este archivo establece la relación entre productos de ambos sistemas</p>
                                                        <ul className="list-disc pl-5 space-y-1">
                                                            <li><code>Código TuAmbia</code>: Identificador en TuAmbia</li>
                                                            <li><code>Código Odoo</code>: Identificador en Odoo</li>
                                                            <li><code>Nombre TuAmbia</code>: Nombre del producto en TuAmbia</li>
                                                            <li><code>Nombre Odoo</code>: Nombre del producto en Odoo</li>
                                                            <li><code>Categoría</code>: Categoría del producto</li>
                                                            <li><code>Visible</code>: Si o No (visibilidad)</li>
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-semibold">2. 📊 Datos de Odoo</h3>
                                                        <p className="text-sm text-gray-400 mb-2">Archivo de stock actual en Odoo</p>
                                                        <ul className="list-disc pl-5 space-y-1">
                                                            <li><code>Producto/Código de barras</code>: Código identificador</li>
                                                            <li><code>Producto</code>: Nombre del producto</li>
                                                            <li><code>Unidad de medida</code>: Unidad utilizada</li>
                                                            <li><code>Cantidad</code>: Stock disponible</li>
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-semibold">3. 🛍️ Datos de TuAmbia - Vendidos</h3>
                                                        <p className="text-sm text-gray-400 mb-2">Archivo de productos vendidos en TuAmbia</p>
                                                        <ul className="list-disc pl-5 space-y-1">
                                                            <li><code>Código</code>: Identificador del producto</li>
                                                            <li><code>Nombre del producto</code>: Nombre completo</li>
                                                            <li><code>Categorí</code>: Categoría del producto</li>
                                                            <li><code>Marca</code>: Marca del producto</li>
                                                            <li><code>Cantidad</code>: Cantidad vendida</li>
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-semibold">4. 📦 Datos de TuAmbia - Disponibles</h3>
                                                        <p className="text-sm text-gray-400 mb-2">Archivo de stock disponible en TuAmbia</p>
                                                        <ul className="list-disc pl-5 space-y-1">
                                                            <li><code>Código</code>: Identificador del producto</li>
                                                            <li><code>Nombre</code>: Nombre del producto</li>
                                                            <li><code>Marca</code>: Marca del producto</li>
                                                            <li><code>Categorí</code>: Categoría del producto</li>
                                                            <li><code>Visible</code>: Estado de visibilidad</li>
                                                            <li><code>Disponibi</code>: Cantidad disponible</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <h2 className="text-xl font-bold text-white">⚠️ Importante</h2>
                                                <ul className="list-disc pl-5 space-y-2">
                                                    <li className="text-yellow-400">Los nombres de las columnas deben ser <strong>exactamente iguales</strong> a los mostrados</li>
                                                    <li>Los códigos deben coincidir entre sistemas para una correcta sincronización</li>
                                                    <li>Se recomienda verificar los datos en la vista previa antes de confirmar</li>
                                                    <li>Los porcentajes de reserva se pueden ajustar en cualquier momento</li>
                                                </ul>
                                            </section>

                                            <section>
                                                <h2 className="text-xl font-bold text-white">💡 Consejos</h2>
                                                <ul className="list-disc pl-5 space-y-2">
                                                    <li>Mantén los archivos actualizados para mayor precisión</li>
                                                    <li>Usa la vista previa para verificar la estructura de los archivos</li>
                                                    <li>Revisa periódicamente los ajustes de reserva</li>
                                                    <li>Guarda una copia de la plantilla como respaldo</li>
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
        </nav>
    );
} 