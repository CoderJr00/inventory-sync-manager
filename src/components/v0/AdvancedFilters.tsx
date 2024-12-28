import { Dispatch, SetStateAction } from 'react'
import { Factory, Package, Filter, PackageCheck, PackageX } from 'lucide-react'

interface AdvancedFiltersProps {
  filters: {
    manufacturable: string;
    hasInventory: string;
  };
  setFilters: Dispatch<SetStateAction<{
    manufacturable: string;
    hasInventory: string;
  }>>;
  itemsPerPage: number;
  setItemsPerPage: Dispatch<SetStateAction<number>>;
}

export default function AdvancedFilters({ filters, setFilters, itemsPerPage, setItemsPerPage }: AdvancedFiltersProps) {
  return (
    <div className="flex space-x-1">
      <div className="relative">
        <Factory className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <select
          value={filters.manufacturable}
          onChange={(e) => setFilters(prev => ({ ...prev, manufacturable: e.target.value }))}
          className="block pl-8 p-2 bg-slate-700 border-slate-600 text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los productos</option>
          <option value="true">Fabricables</option>
          <option value="false">No fabricables</option>
        </select>
      </div>

      <div className="relative">
        <Package className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <select
          value={filters.hasInventory}
          onChange={(e) => setFilters(prev => ({ ...prev, hasInventory: e.target.value }))}
          className="block pl-8 p-2 bg-slate-700 border-slate-600 text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todo el inventario</option>
          <option value="true">Con existencias</option>
          <option value="false">Sin existencias</option>
        </select>
      </div>
    </div>
  )
}

