import React from 'react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Package, ClipboardList, Menu, X } from 'lucide-react'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onSelectOption: (option: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ className, onSelectOption, isOpen, onToggle}: SidebarProps) {
  const [selectedOption, setSelectedOption] = React.useState<string>('products-view')

  const handleOptionClick = (option: string) => {
    setSelectedOption(option)
    onSelectOption(option)
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-40 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
        onClick={onToggle}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-400 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "bg-gray-800 border-r border-gray-700",
        className
      )}>
        <div className="space-y-4 py-4 pt-16">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-white">
              Dashboard
            </h2>
            <div className="space-y-1">
              <Button
                variant={selectedOption === 'products-view' ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start",
                  selectedOption === 'products-view'
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
                onClick={() => {
                  handleOptionClick('products-view')
                  onToggle()
                }
                }
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Gestión de Productos
              </Button>
              <Button
                variant={selectedOption === 'inventario-view' ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start",
                  selectedOption === 'inventario-view'
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
                onClick={() => {
                  handleOptionClick('inventario-view')
                  onToggle()
                }
                }
              >
                <Package className="mr-2 h-4 w-4" />
                Inventario TuAmbia
              </Button>

              {/* <Button
                variant={selectedOption === 'plan-trabajo-view' ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start",
                  selectedOption === 'plan-trabajo-view'
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
                onClick={() => {
                  handleOptionClick('plan-trabajo-view')
                  onToggle()
                }
                }
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Gestión de Plan de Trabajo
              </Button> */}


            </div>
          </div>
        </div>
      </div >
    </>
  )
}

