"use client";

import { useEffect, useState } from "react";
import { DeanSidebar } from "./DeanSidebar";

export function DeanClientSidebar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-64 min-h-screen bg-white border-r border-gray-200 shadow-sm z-40 flex flex-col">
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-6 space-y-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Menu</div>
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="px-3 py-2 mb-2 bg-gray-50 rounded-md">
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return <DeanSidebar />;
}


