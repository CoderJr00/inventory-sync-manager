import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface Column {
  key: string
  label: string
}

interface ColumnSelectorProps {
  columns: Column[]
  visibleColumns: string[]
  setVisibleColumns: (columns: string[]) => void
}

export default function ColumnSelector({ columns, visibleColumns, setVisibleColumns }: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleColumn = (columnKey: string) => {
    if (visibleColumns.includes(columnKey)) {
      setVisibleColumns(visibleColumns.filter(key => key !== columnKey))
    } else {
      setVisibleColumns([...visibleColumns, columnKey])
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2 px-4 rounded inline-flex items-center transition-colors border border-slate-600"
      >
        <Eye className="w-5 h-5 mr-2" />
        Columnas visibles
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-slate-800 ring-1 ring-slate-700">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {columns.map(column => (
              <button
                key={column.key}
                onClick={() => toggleColumn(column.key)}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center transition-colors"
                role="menuitem"
              >
                {visibleColumns.includes(column.key) ? (
                  <Eye className="w-5 h-5 mr-2 text-blue-400" />
                ) : (
                  <EyeOff className="w-5 h-5 mr-2 text-slate-500" />
                )}
                {column.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

