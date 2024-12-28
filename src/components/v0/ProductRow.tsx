import { CheckCircleIcon, XCircleIcon } from 'lucide-react'

interface ProductRowProps {
  product: {
    id?: string;
    odooCode: string;
    odooName: string;
    cantidadInventario: number;
    unidadMedida: string;
    minimum: number;
    maximum: number;
    category: string;
    fabricable: boolean;
  }
  visibleColumns: string[]
}

export default function ProductRow({ product, visibleColumns }: ProductRowProps) {
  return (
    <tr className="hover:bg-slate-700/50 transition-colors">
      {visibleColumns.includes('odooCode') && (
        <td className="px-2 py-4 text-sm text-slate-300 truncate">{product.odooCode}</td>
      )}
      {visibleColumns.includes('odooName') && (
        <td className="px-2 py-4 text-sm text-slate-300 truncate">{product.odooName}</td>
      )}
      {visibleColumns.includes('cantidadInventario') && (
        <td className="px-2 py-4 text-sm text-slate-300 truncate">{product.cantidadInventario}</td>
      )}
      {visibleColumns.includes('unidadMedida') && (
        <td className="px-2 py-4 text-sm text-slate-300 truncate">{product.unidadMedida}</td>
      )}
      {visibleColumns.includes('minimum') && (
        <td className="px-2 py-4 text-sm text-slate-300 truncate">{product.minimum}</td>
      )}
      {visibleColumns.includes('maximum') && (
        <td className="px-2 py-4 text-sm text-slate-300 truncate">{product.maximum}</td>
      )}
      {visibleColumns.includes('category') && (
        <td className="px-2 py-4 text-sm text-slate-300 truncate">{product.category}</td>
      )}
      {visibleColumns.includes('fabricable') && (
        <td className="px-2 py-4 text-sm text-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.fabricable 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {product.fabricable ? 'Sí' : 'No'}
          </span>
        </td>
      )}
    </tr>
  )
}

