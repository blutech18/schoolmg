'use client';

import React from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { Badge } from './badge';

interface ExcuseLetterCount {
  subjectCode: string;
  subjectTitle?: string;
  count: number;
}

interface ExcuseLetterNotificationBarProps {
  excuseLetterCounts: ExcuseLetterCount[];
  title?: string;
  className?: string;
}

export function ExcuseLetterNotificationBar({
  excuseLetterCounts,
  title = "Pending Excuse Letters",
  className = ""
}: ExcuseLetterNotificationBarProps) {
  const totalPending = excuseLetterCounts.reduce((sum, item) => sum + item.count, 0);

  if (totalPending === 0) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-semibold text-yellow-800">{title}</h4>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
              {totalPending} Total
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {excuseLetterCounts.map((item, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-yellow-200 rounded-full text-sm"
              >
                <FileText className="h-3.5 w-3.5 text-yellow-600" />
                <span className="font-medium text-yellow-800">{item.subjectCode}:</span>
                <span className="text-yellow-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function calculateExcuseLetterCountsBySubject(
  excuseLetters: Array<{ SubjectCode: string; SubjectTitle?: string; Status?: string; InstructorStatus?: string; CoordinatorStatus?: string; DeanStatus?: string }>,
  statusField: 'Status' | 'InstructorStatus' | 'CoordinatorStatus' | 'DeanStatus' = 'Status'
): ExcuseLetterCount[] {
  const pendingLetters = excuseLetters.filter(letter => {
    const status = letter[statusField] || letter.Status || 'pending';
    return status.toLowerCase() === 'pending';
  });

  const countMap: { [key: string]: { count: number; title?: string } } = {};
  
  pendingLetters.forEach(letter => {
    const code = letter.SubjectCode;
    if (!countMap[code]) {
      countMap[code] = { count: 0, title: letter.SubjectTitle };
    }
    countMap[code].count++;
  });

  return Object.entries(countMap).map(([subjectCode, data]) => ({
    subjectCode,
    subjectTitle: data.title,
    count: data.count
  })).sort((a, b) => b.count - a.count);
}

export default ExcuseLetterNotificationBar;
