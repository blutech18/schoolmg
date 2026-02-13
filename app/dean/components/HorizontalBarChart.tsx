'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  Activity, TrendingUp, Users, BookOpen, 
  BarChart3,
  Target, ClipboardList, GraduationCap, Calendar
} from "lucide-react";

interface HorizontalBarChartProps {
  data: {
    category: string;
    value: number;
    label: string;
    color: string;
    icon: React.ReactNode;
  }[];
  onCategoryClick: (category: string) => void;
  selectedCategory?: string;
}

interface DetailedViewProps {
  category: string;
  onBack: () => void;
  data: {
    attendance: any[];
    performance: any[];
    enrollment: any[];
    sections: any[];
    atRisk: any[];
    passRate: any[];
    excuseLetters: any[];
    instructors: any[];
    subjects: any[];
    rooms: any[];
    schedules: any[];
    gradeDistribution: any[];
    schoolYear: any[];
    institute: any[];
    courses: any[];
  };
}

// Color palette for consistency
const COLORS = {
  attendance: '#00C49F',
  performance: '#0088FE', 
  enrollment: '#FFBB28',
  sections: '#FF8042',
  default: '#8884D8'
};

// Helper function to get category icons
const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case 'attendance': return <Activity className="h-6 w-6" style={{ color: COLORS.attendance }} />;
    case 'performance': return <TrendingUp className="h-6 w-6" style={{ color: COLORS.performance }} />;
    case 'enrollment': return <Users className="h-6 w-6" style={{ color: COLORS.enrollment }} />;
    case 'sections': return <BookOpen className="h-6 w-6" style={{ color: COLORS.sections }} />;
    case 'atRisk': return <Target className="h-6 w-6" style={{ color: '#DC2626' }} />;
    case 'passRate': return <TrendingUp className="h-6 w-6" style={{ color: '#059669' }} />;
    case 'excuseLetters': return <ClipboardList className="h-6 w-6" style={{ color: '#D97706' }} />;
    case 'instructors': return <GraduationCap className="h-6 w-6" style={{ color: '#7C3AED' }} />;
    case 'subjects': return <BookOpen className="h-6 w-6" style={{ color: '#0891B2' }} />;
    case 'rooms': return <Calendar className="h-6 w-6" style={{ color: '#BE185D' }} />;
    case 'schedules': return <Calendar className="h-6 w-6" style={{ color: '#0F766E' }} />;
    case 'gradeDistribution': return <TrendingUp className="h-6 w-6" style={{ color: '#16A34A' }} />;
    case 'schoolYear': return <TrendingUp className="h-6 w-6" style={{ color: '#00C49F' }} />;
    case 'institute': return <GraduationCap className="h-6 w-6" style={{ color: '#0088FE' }} />;
    case 'courses': return <GraduationCap className="h-6 w-6" style={{ color: '#7C3AED' }} />;
    default: return <BarChart3 className="h-6 w-6" style={{ color: COLORS.default }} />;
  }
};


export function HorizontalBarChart({ data, onCategoryClick, selectedCategory }: HorizontalBarChartProps) {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <Card className="w-full transition-all duration-300 ease-in-out">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Horizontal Bar Graph */}
          <div className="relative min-h-[320px] transition-all duration-500 ease-in-out">
            {/* Chart area */}
            <div className="space-y-6">
              {data.map((item, index) => (
                 <div
                   key={item.category}
                   onClick={() => onCategoryClick(item.category)}
                   className={`
                     relative cursor-pointer group h-16 flex items-center 
                     transition-all duration-300 ease-in-out transform
                     hover:scale-[1.02] hover:shadow-lg
                     ${selectedCategory === item.category 
                       ? 'scale-[1.02] shadow-lg ring-2 ring-blue-200 ring-opacity-50' 
                       : 'hover:bg-gray-50'
                     }
                     rounded-lg p-2 -m-2
                   `}
                   title={item.label}
                 >
                  {/* Icon */}
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm mr-4
                      transition-all duration-300 ease-in-out
                      ${selectedCategory === item.category 
                        ? 'scale-110 shadow-lg' 
                        : 'group-hover:scale-105 group-hover:shadow-md'
                      }
                    `}
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <div 
                      className="transition-all duration-300 ease-in-out"
                      style={{ color: item.color }}
                    >
                      {item.icon}
                    </div>
                  </div>
                  
                  {/* Horizontal bar */}
                  <div 
                    className={`
                      h-10 rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-4 shadow-sm
                      ${selectedCategory === item.category 
                        ? 'h-12 shadow-lg' 
                        : 'group-hover:h-12 group-hover:shadow-md'
                      }
                    `}
                    style={{ 
                      width: `calc(${(item.value / maxValue) * 80}% + 100px)`,
                      backgroundColor: item.color,
                      minWidth: '100px'
                    }}
                  >
                    {/* Value label on bar */}
                    <span className="text-white font-bold text-sm transition-all duration-300 ease-in-out">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Selection indicator */}
                  {selectedCategory === item.category && (
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-3 h-12 bg-blue-600 rounded-full shadow-md animate-pulse"></div>
                  )}
                  
                   {/* Custom Tooltip */}
                   <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none z-20 whitespace-nowrap">
                     {item.label}
                     <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                   </div>
                   
                   {/* Click ripple effect */}
                   <div className="absolute inset-0 rounded-lg overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300 ease-in-out transform -skew-x-12 -translate-x-full group-hover:translate-x-full group-hover:transition-transform group-hover:duration-700"></div>
                   </div>
                </div>
              ))}
            </div>

            {/* X-axis */}
            <div className="mt-8 relative transition-all duration-300 ease-in-out">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span className="font-medium transition-all duration-300 ease-in-out">0</span>
                <span className="font-medium transition-all duration-300 ease-in-out">{Math.round(maxValue * 0.25).toLocaleString()}</span>
                <span className="font-medium transition-all duration-300 ease-in-out">{Math.round(maxValue * 0.5).toLocaleString()}</span>
                <span className="font-medium transition-all duration-300 ease-in-out">{Math.round(maxValue * 0.75).toLocaleString()}</span>
                <span className="font-medium transition-all duration-300 ease-in-out">{maxValue.toLocaleString()}</span>
              </div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gray-400 transition-all duration-300 ease-in-out"></div>
            </div>
          </div>

          {/* Click instruction */}
          <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-100">
            <p className="transition-all duration-300 ease-in-out">Click on any bar to view detailed analytics</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DetailedView({ category, onBack, data }: DetailedViewProps) {
  // Use real data from props instead of mock data
  const categoryData = data[category as keyof typeof data];
  
  if (!categoryData || !Array.isArray(categoryData) || categoryData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getCategoryIcon(category)}
              <div>
                <CardTitle className="capitalize">{category} Analytics</CardTitle>
                <p className="text-sm text-gray-600">No data available</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md"
            >
              ← Back to Overview
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No data available for {category} analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    if (!categoryData || categoryData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No data available for {category} analytics</p>
        </div>
      );
    }

    switch (category) {
      case 'attendance':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendance" fill={COLORS.attendance} name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, attendance }) => `${name}: ${attendance}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="attendance"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`${COLORS.attendance}${80 + index * 10}`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Attendance Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Records</span>
                    <span className="font-semibold">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Average Attendance</span>
                    <span className="font-semibold">
                      {categoryData.length > 0 
                        ? Math.round(categoryData.reduce((sum, item) => sum + (item.attendance || 0), 0) / categoryData.length) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageGrade" fill={COLORS.performance} name="Average Grade" />
                <Bar dataKey="atRisk" fill="#FF8042" name="At Risk Students" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="averageGrade" stroke={COLORS.performance} name="Average Grade" />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Performance Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Sections</span>
                    <span className="font-semibold">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Average Grade</span>
                    <span className="font-semibold">
                      {categoryData.length > 0 
                        ? Math.round(categoryData.reduce((sum, item) => sum + (item.averageGrade || 0), 0) / categoryData.length) 
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'enrollment':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="enrolled" stackId="1" stroke={COLORS.enrollment} fill={COLORS.enrollment} name="Total Enrolled" />
                <Area type="monotone" dataKey="new" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="New Enrollments" />
              </AreaChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="enrolled" stroke={COLORS.enrollment} name="Total Enrolled" />
                  <Line type="monotone" dataKey="new" stroke="#82ca9d" name="New Enrollments" />
                  <Line type="monotone" dataKey="graduates" stroke="#FF8042" name="Graduates" />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Enrollment Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Periods</span>
                    <span className="font-semibold">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Latest Enrollment</span>
                    <span className="font-semibold">
                      {categoryData.length > 0 ? categoryData[categoryData.length - 1].enrolled : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sections':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalStudents" fill={COLORS.sections} name="Students" />
                <Bar dataKey="totalSubjects" fill="#82ca9d" name="Subjects" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ course, totalStudents }) => `${course}: ${totalStudents}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalStudents"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`${COLORS.sections}${80 + index * 20}`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Section Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Sections</span>
                    <span className="font-semibold">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Students</span>
                    <span className="font-semibold">
                      {categoryData.reduce((sum, item) => sum + (item.totalStudents || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'atRisk':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-4">At-Risk Students Alert</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Total At-Risk Students</span>
                    <span className="font-semibold text-red-600">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Average Risk Score</span>
                    <span className="font-semibold text-red-600">
                      {categoryData.length > 0 
                        ? Math.round(categoryData.reduce((sum, item) => sum + (item.riskLevel || 0), 0) / categoryData.length) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-4">Intervention Needed</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Students Needing Support</span>
                    <span className="font-semibold text-yellow-600">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Priority Level</span>
                    <span className="font-semibold text-yellow-600">High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'passRate':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-4">Pass Rate Overview</h4>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {categoryData.length > 0 
                      ? Math.round(categoryData.reduce((sum, item) => sum + (item.passRate || 0), 0) / categoryData.length) 
                      : 0}%
                  </div>
                  <p className="text-green-700">Overall Pass Rate</p>
                </div>
              </div>
              
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-4">Performance Trends</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Excellent (90%+)</span>
                    <span className="font-semibold text-blue-600">
                      {Math.round(categoryData.reduce((sum, item) => sum + (item.excellent || 0), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Good (80-89%)</span>
                    <span className="font-semibold text-blue-600">
                      {Math.round(categoryData.reduce((sum, item) => sum + (item.good || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-4">Improvement Areas</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Satisfactory (75-79%)</span>
                    <span className="font-semibold text-orange-600">
                      {Math.round(categoryData.reduce((sum, item) => sum + (item.satisfactory || 0), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Below Standard</span>
                    <span className="font-semibold text-orange-600">
                      {Math.round(categoryData.reduce((sum, item) => sum + (item.belowStandard || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'excuseLetters':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-4">Excuse Letters Status</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Total Excuse Letters</span>
                    <span className="font-semibold text-orange-600">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Pending Review</span>
                    <span className="font-semibold text-orange-600">
                      {categoryData.filter(item => item.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Approved</span>
                    <span className="font-semibold text-green-600">
                      {categoryData.filter(item => item.status === 'approved').length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-4">Processing Time</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Average Processing</span>
                    <span className="font-semibold text-blue-600">
                      {categoryData.length > 0 ? '2.5 days' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Urgent Cases</span>
                    <span className="font-semibold text-red-600">
                      {categoryData.filter(item => item.priority === 'urgent').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'instructors':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="subjects" fill="#7C3AED" name="Subjects Taught" />
                <Bar dataKey="students" fill="#82ca9d" name="Total Students" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Instructor Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Instructors</span>
                    <span className="font-semibold">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Average Workload</span>
                    <span className="font-semibold">
                      {categoryData.length > 0 
                        ? Math.round(categoryData.reduce((sum, item) => sum + (item.subjects || 0), 0) / categoryData.length) 
                        : 0} subjects
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Performance Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Average Rating</span>
                    <span className="font-semibold">
                      {categoryData.length > 0 
                        ? (categoryData.reduce((sum, item) => sum + (item.rating || 0), 0) / categoryData.length).toFixed(1)
                        : 'N/A'}/5.0
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Students</span>
                    <span className="font-semibold">
                      {categoryData.reduce((sum, item) => sum + (item.students || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'subjects':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#0891B2" name="Students Enrolled" />
                <Bar dataKey="schedules" fill="#82ca9d" name="Class Schedules" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, students }) => `${name}: ${students}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="students"
                  >
                    {categoryData.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`#0891B2${80 + index * 20}`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Subject Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Subjects</span>
                    <span className="font-semibold">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Students</span>
                    <span className="font-semibold">
                      {categoryData.reduce((sum, item) => sum + (item.students || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Schedules</span>
                    <span className="font-semibold">
                      {categoryData.reduce((sum, item) => sum + (item.schedules || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'rooms':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-pink-50 rounded-lg border border-pink-200">
                <h4 className="font-semibold text-pink-800 mb-4">Room Utilization</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Total Rooms</span>
                    <span className="font-semibold text-pink-600">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Active Rooms</span>
                    <span className="font-semibold text-pink-600">
                      {categoryData.filter(item => item.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Utilization Rate</span>
                    <span className="font-semibold text-pink-600">
                      {categoryData.length > 0 
                        ? Math.round((categoryData.filter(item => item.status === 'active').length / categoryData.length) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-4">Capacity Overview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Total Capacity</span>
                    <span className="font-semibold text-purple-600">
                      {categoryData.reduce((sum, item) => sum + (item.capacity || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-lg">
                    <span>Average Occupancy</span>
                    <span className="font-semibold text-purple-600">
                      {categoryData.length > 0 
                        ? Math.round(categoryData.reduce((sum, item) => sum + (item.occupancy || 0), 0) / categoryData.length)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'schedules':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData.reduce((acc, item) => {
                const existing = acc.find((x: any) => x.day === item.day);
                if (existing) {
                  existing.count += 1;
                } else {
                  acc.push({ day: item.day, count: 1 });
                }
                return acc;
              }, [])}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0F766E" name="Schedules" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Schedule Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Schedules</span>
                    <span className="font-semibold">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Active Schedules</span>
                    <span className="font-semibold">
                      {categoryData.filter(item => item.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Peak Hours</span>
                    <span className="font-semibold">
                      {categoryData.length > 0 ? '8:00 AM - 12:00 PM' : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Time Distribution</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Morning Classes</span>
                    <span className="font-semibold">
                      {categoryData.filter(item => item.timeSlot === 'morning').length}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Afternoon Classes</span>
                    <span className="font-semibold">
                      {categoryData.filter(item => item.timeSlot === 'afternoon').length}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Evening Classes</span>
                    <span className="font-semibold">
                      {categoryData.filter(item => item.timeSlot === 'evening').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'gradeDistribution':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-4">Excellent (90%+)</h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {categoryData.length > 0 
                      ? Math.round(categoryData.reduce((sum, item) => sum + (item.excellent || 0), 0))
                      : 0}
                  </div>
                  <p className="text-green-700">Students</p>
                </div>
              </div>
              
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-4">Good (80-89%)</h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {categoryData.length > 0 
                      ? Math.round(categoryData.reduce((sum, item) => sum + (item.good || 0), 0))
                      : 0}
                  </div>
                  <p className="text-blue-700">Students</p>
                </div>
              </div>
              
              <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-4">Satisfactory (75-79%)</h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {categoryData.length > 0 
                      ? Math.round(categoryData.reduce((sum, item) => sum + (item.satisfactory || 0), 0))
                      : 0}
                  </div>
                  <p className="text-yellow-700">Students</p>
                </div>
              </div>
              
              <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-4">Below Standard (&lt;75%)</h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {categoryData.length > 0 
                      ? Math.round(categoryData.reduce((sum, item) => sum + (item.belowStandard || 0), 0))
                      : 0}
                  </div>
                  <p className="text-red-700">Students</p>
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Excellent', value: categoryData.reduce((sum, item) => sum + (item.excellent || 0), 0), fill: '#16A34A' },
                    { name: 'Good', value: categoryData.reduce((sum, item) => sum + (item.good || 0), 0), fill: '#2563EB' },
                    { name: 'Satisfactory', value: categoryData.reduce((sum, item) => sum + (item.satisfactory || 0), 0), fill: '#D97706' },
                    { name: 'Below Standard', value: categoryData.reduce((sum, item) => sum + (item.belowStandard || 0), 0), fill: '#DC2626' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#16A34A" />
                  <Cell fill="#2563EB" />
                  <Cell fill="#D97706" />
                  <Cell fill="#DC2626" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'schoolYear':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#3B82F6" name="Students" />
                <Bar dataKey="courses" fill="#10B981" name="Courses" />
                <Bar dataKey="subjects" fill="#F59E0B" name="Subjects" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">School Year Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total School Years</span>
                    <span className="font-semibold">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Students</span>
                    <span className="font-semibold">
                      {categoryData.reduce((sum, item) => sum + (item.students || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Course Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Courses</span>
                    <span className="font-semibold">
                      {categoryData.reduce((sum, item) => sum + (item.courses || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Subjects</span>
                    <span className="font-semibold">
                      {categoryData.reduce((sum, item) => sum + (item.subjects || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, students }) => `${name}: ${students}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="students"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'institute':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#0088FE" name="Students" />
                <Bar dataKey="courses" fill="#00C49F" name="Courses" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="averageAttendance" fill="#10B981" name="Avg Attendance %" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Institute Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Institutes</span>
                    <span className="font-semibold">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Students</span>
                    <span className="font-semibold">
                      {categoryData.reduce((sum, item) => sum + (item.students || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Average Attendance</span>
                    <span className="font-semibold">
                      {categoryData.length > 0 
                        ? Math.round((categoryData.reduce((sum, item) => sum + (item.averageAttendance || 0), 0) / categoryData.length) * 10) / 10
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'courses':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#7C3AED" name="Students" />
                <Bar dataKey="attendance" fill="#10B981" name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="passRate" fill="#059669" name="Pass Rate %" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Course Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Courses</span>
                    <span className="font-semibold">{categoryData.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Total Students</span>
                    <span className="font-semibold">
                      {categoryData.reduce((sum, item) => sum + (item.students || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Average Pass Rate</span>
                    <span className="font-semibold">
                      {categoryData.length > 0 
                        ? Math.round((categoryData.reduce((sum, item) => sum + (item.passRate || 0), 0) / categoryData.length) * 10) / 10
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>No data available for {category} analytics</p>
          </div>
        );
    }
  };

  return (
    <Card className="w-full animate-in slide-in-from-left-4 duration-500 ease-out">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 animate-in fade-in-0 duration-700 ease-out delay-200">
            {getCategoryIcon(category)}
            <div>
              <CardTitle className="capitalize animate-in slide-in-from-bottom-2 duration-500 ease-out delay-300">
                {category} Analytics
              </CardTitle>
              <p className="text-sm text-gray-600 animate-in slide-in-from-bottom-2 duration-500 ease-out delay-400">
                Detailed view and insights
              </p>
            </div>
          </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md animate-in slide-in-from-right-4 delay-200"
            >
            ← Back to Overview
          </button>
        </div>
      </CardHeader>
      <CardContent className="animate-in slide-in-from-bottom-4 duration-700 ease-out delay-500">
        {renderChart()}
      </CardContent>
    </Card>
  );
}

export default HorizontalBarChart;
