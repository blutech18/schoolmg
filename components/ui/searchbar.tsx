'use client'

import { Search } from 'lucide-react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

export function SearchBar({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  className,
  disabled = false 
}: SearchBarProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-3 h-4 w-4 text-gray-500 pointer-events-none z-10" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="pl-10"
      />
    </div>
  )
}
