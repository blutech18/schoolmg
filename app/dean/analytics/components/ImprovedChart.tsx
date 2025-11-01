'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from "recharts"
import { 
  BarChart3, TrendingUp, PieChart as PieChartIcon, Activity
} from "lucide-react"

// Consistent color palette for CCA branding
export const CHART_COLORS = {
  primary: '#1e40af', // Blue
  secondary: '#059669', // Green
  accent: '#dc2626', // Red
  warning: '#d97706', // Orange
  info: '#7c3aed', // Purple
  success: '#16a34a', // Green
  gradient: {
    from: '#3b82f6',
    to: '#1e40af'
  }
}

export const CHART_COLOR_ARRAY = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.success,
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4' // Cyan
]

interface ChartProps {
  title: string
  description?: string
  data: any[]
  type: 'bar' | 'line' | 'area' | 'pie' | 'composed'
  dataKey: string
  xAxisKey?: string
  height?: number
  className?: string
  showLegend?: boolean
  showGrid?: boolean
  tooltipFormatter?: (value: any, name: string) => [string, string]
  customTooltip?: React.ComponentType<any>
}

// Custom Tooltip Component
const CustomTooltip: React.FC<any> = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">
              {entry.name}: {formatter ? formatter(entry.value, entry.name)[0] : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// Custom Legend Component
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex justify-center gap-6 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ImprovedChart({
  title,
  description,
  data,
  type,
  dataKey,
  xAxisKey = 'name',
  height = 300,
  className = '',
  showLegend = true,
  showGrid = true,
  tooltipFormatter,
  customTooltip
}: ChartProps) {
  const TooltipComponent = customTooltip || CustomTooltip

  // Create a function that returns the tooltip content
  const getTooltipContent = (props: any) => {
    if (customTooltip) {
      const CustomTooltipComponent = customTooltip
      return <CustomTooltipComponent {...props} formatter={tooltipFormatter} />
    }
    return <CustomTooltip {...props} formatter={tooltipFormatter} />
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    }

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              content={getTooltipContent}
              formatter={tooltipFormatter}
            />
            {showLegend && <Legend content={<CustomLegend />} />}
            <Bar 
              dataKey={dataKey} 
              fill={CHART_COLORS.primary}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )

      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              content={getTooltipContent}
              formatter={tooltipFormatter}
            />
            {showLegend && <Legend content={<CustomLegend />} />}
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={CHART_COLORS.primary}
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2 }}
            />
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              content={getTooltipContent}
              formatter={tooltipFormatter}
            />
            {showLegend && <Legend content={<CustomLegend />} />}
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={CHART_COLORS.primary}
              fill={`url(#gradient)`}
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.gradient.from} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={CHART_COLORS.gradient.to} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </AreaChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey={dataKey}
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length]} />
              ))}
            </Pie>
            <Tooltip 
              content={getTooltipContent}
              formatter={tooltipFormatter}
            />
            {showLegend && <Legend content={<CustomLegend />} />}
          </PieChart>
        )

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              content={getTooltipContent}
              formatter={tooltipFormatter}
            />
            {showLegend && <Legend content={<CustomLegend />} />}
            <Bar dataKey="barValue" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="lineValue" stroke={CHART_COLORS.accent} strokeWidth={2} />
          </ComposedChart>
        )

      default:
        return <div>Unknown chart type</div>
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="h-5 w-5" />
      case 'line':
      case 'area':
        return <TrendingUp className="h-5 w-5" />
      case 'pie':
        return <PieChartIcon className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getIcon()}
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
