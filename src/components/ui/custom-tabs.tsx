"use client"

import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils/utils"

export interface TabItem {
  id: string
  label: string
  icon: LucideIcon
}

interface CustomTabsProps {
  items: TabItem[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function CustomTabs({ items, value, onValueChange, className }: CustomTabsProps) {
  return (
    <div className={cn(
      "flex p-1.5 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl w-fit backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-sm",
      className
    )}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.id}
            onClick={() => onValueChange(item.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              value === item.id
                ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-md scale-[1.02]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-900/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}