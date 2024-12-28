'use client'

import { useState, useMemo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, Search } from 'lucide-react'
import ProductRow from './ProductRow'
import AdvancedFilters from './AdvancedFilters'
import { Product } from "@/types/inventory";
import ColumnSelector from './ColumnSelector'

interface ProductTableProps {
  products: Product[];
}

const columns = [
  { key: 'odooCode', label: 'Código' },
  { key: 'odooName', label: 'Nombre' },
  { key: 'cantidadInventario', label: 'Cant.' },
  { key: 'unidadMedida', label: 'U/M' },
  { key: 'minimum', label: 'Mínimo' },
  { key: 'maximum', label: 'Máximo' },
  { key: 'category', label: 'Categoría' },
  { key: 'fabricable', label: 'Fabricable' },
]

export default function ProductTable({ products }: ProductTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ 
    manufacturable: '',
    hasInventory: '' 
  })
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col.key))

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      ((product.odooCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
       (product.odooName?.toLowerCase() || '').includes(searchTerm.toLowerCase())) &&
      (filters.manufacturable === '' || product.fabricable.toString() === filters.manufacturable) &&
      (filters.hasInventory === '' || 
       (filters.hasInventory === 'true' ? product.cantidadInventario > 0 : product.cantidadInventario === 0))
    )
  }, [products, searchTerm, filters]);

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-lg overflow-hidden border border-slate-700">
      <div className="flex justify-between items-center p-2">
        <div className="relative w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por código o nombre"
            className="w-full pl-10 p-2 bg-slate-700 border-slate-600 text-slate-200 rounded-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex justify-between items-center gap-2">
          <AdvancedFilters filters={filters} setFilters={setFilters} itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage} />
          <ColumnSelector
            columns={columns}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
          />
        </div>
      </div>
      <table className="w-full table-fixed divide-y divide-slate-700">
        <thead className="bg-slate-800">
          <tr>
            {columns.map(column => (
              visibleColumns.includes(column.key) && (
                <th 
                  key={column.key} 
                  className="px-2 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider truncate"
                  style={{ width: column.key === 'odooName' ? '30%' : 'auto' }}
                >
                  {column.label}
                </th>
              )
            ))}
          </tr>
        </thead>
        <tbody className="bg-slate-800/50 divide-y divide-slate-700">
          {currentProducts.map((product) => (
            <ProductRow key={product.id} product={product} visibleColumns={visibleColumns} />
          ))}
        </tbody>
      </table>
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-slate-700">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-300">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>-<span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> /{' '}
              <span className="font-medium">{filteredProducts.length}</span> resultados
            </p>
          </div>
          <div className="flex items-center justify-end space-x-4">
            <div className="flex items-center">
              <label htmlFor="itemsPerPage" className="mr-2 text-sm text-slate-300">
                Productos por página:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="rounded-md border-slate-600 bg-slate-600 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-200 focus:ring-opacity-50"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600"
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

