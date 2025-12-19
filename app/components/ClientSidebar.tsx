"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "./Sidebar";
import { CoordinatorSidebar } from "../coordinator/components/CoordinatorSidebar";
import { getSession } from "@/helpers/session";

export function ClientSidebar() {
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const session = await getSession();
      setUserRole(session.role || "");
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  };

  if (!mounted) {
    // Return a static loading skeleton that matches the server-rendered HTML
    return (
      <div className="w-64 min-h-screen bg-white border-r border-gray-200 shadow-sm z-50">
        <div className="bg-green-800 flex items-center justify-center h-[75px]">
          <div className="w-10 h-10 bg-green-700 rounded animate-pulse"></div>
        </div>
        <div className="px-4 py-6 space-y-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Menu
          </div>
          <div className="space-y-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-auto p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div>
              <div className="w-24 h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use CoordinatorSidebar if user is a program coordinator
  if (userRole === "programcoor") {
    return <CoordinatorSidebar />;
  }

  return <AppSidebar />;
}
