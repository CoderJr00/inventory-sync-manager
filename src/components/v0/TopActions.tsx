'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { showNotification } from '../Notification'
import { 
  Upload, 
  RefreshCw, 
  ShoppingCart, 
  Factory,
  Trash2
} from 'lucide-react'

interface TopActionsProps {
  setShowUpload: (show: boolean) => void;
  setStockUpload: (show: boolean) => void;
  handleDeleteAllProducts: () => void;
  handleCopyBuyList: () => void;
  handleCopyProductionList: () => void;
  productsLength: number;
}

export default function TopActions({ 
  setShowUpload, 
  setStockUpload,
  handleDeleteAllProducts,
  handleCopyBuyList,
  handleCopyProductionList,
  productsLength 
}: TopActionsProps) {
  return (
    <div className="flex justify-evenly space-x-2">
      <button
        onClick={() => setShowUpload(true)}
        className="bg-slate-600 hover:bg-slate-700 text-slate-200 font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors border border-slate-500"
      >
        <Upload className="h-5 w-5" />
        <span>Cargar/Actualizar productos</span>
      </button>
      <button
        onClick={() => setStockUpload(true)}
        className="bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors border border-emerald-500/30"
      >
        <RefreshCw className="h-5 w-5" />
        <span>Actualizar stock desde Odoo</span>
      </button>
      <button
        onClick={handleCopyBuyList}
        className="bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors border border-amber-500/30"
        hidden={productsLength === 0}
      >
        <ShoppingCart className="h-5 w-5" />
        <span>Calcular pedido de compra</span>
      </button>
      <button
        onClick={handleCopyProductionList}
        className="bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors border border-indigo-500/30"
        hidden={productsLength === 0}
      >
        <Factory className="h-5 w-5" />
        <span>Calcular plan de producción</span>
      </button>
      <button
        onClick={handleDeleteAllProducts}
        className="bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors border border-rose-500/30"
        hidden={productsLength === 0}
      >
        <Trash2 className="h-5 w-5" />
        <span>Eliminar Todos</span>
      </button>
    </div>
  )
}

