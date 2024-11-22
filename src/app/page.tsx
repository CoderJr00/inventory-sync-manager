"use client"
import TableUploadRow from './components/TableUploadRow';
import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
// import { Inventario } from '@/components/inventario'
import { PlanTrabajo } from '@/components/plan-trabajo'
import React from 'react';

export default function Home() {
  const [selectedOption, setSelectedOption] = useState<string>('inventario')
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  const handleSelectOption = (option: string) => {
    setSelectedOption(option)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex h-screen bg-pattern">
      <div className="hidden lg:block">
        <Sidebar
          onSelectOption={handleSelectOption}
          className="bg-slate-900/95 backdrop-blur-sm shadow-xl border-r border-slate-700"
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
        />
      </div>
      <div className="lg:hidden">
        <Sidebar
          onSelectOption={handleSelectOption}
          className="bg-slate-900/95 backdrop-blur-sm shadow-xl"
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
        />
      </div>
      <main className="flex-1 overflow-y-auto bg-slate-900/50 backdrop-blur-sm">
        {selectedOption === 'inventario' && <TableUploadRow />}
        {selectedOption === 'plan-trabajo' && <PlanTrabajo />}
      </main>
    </div>
  )
}
