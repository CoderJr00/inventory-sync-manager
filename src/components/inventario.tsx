"use client"

import TableUploadRow from "@/app/components/TableUploadRow"

export function Inventario() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-200">
          Inventario TuAmbia
        </h2>
      </div>
      <div className="border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-lg">
        <TableUploadRow />
      </div>
    </div>
  )
} 