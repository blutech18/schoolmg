"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { 
  Home,
  GraduationCap, 
  LogOut, 
  UserCheck, 
  BarChart3, 
  FileText,
  Users,
  Settings,
  Calendar,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { getSession, deleteSession, ISessionData } from "@/helpers/session";
import { useRouter, usePathname } from "next/navigation";
import { LogoutConfirmationModal } from "@/components/ui/logout-confirmation-modal";

const menuItems = [
  {
    title: "Dashboard",
    url: "/coordinator",
    icon: Home,
  },
  {
    title: "System Overview",
    url: "/coordinator/system-overview",
    icon: BarChart3,
  },
  {
    title: "Students",
    url: "/coordinator/students",
    icon: GraduationCap,
  },
  {
    title: "Instructors",
    url: "/coordinator/instructors",
    icon: UserCheck,
  },
  {
    title: "Schedules",
    url: "/coordinator/schedules",
    icon: Calendar,
  },
  {
    title: "Enrollments",
    url: "/coordinator/enrollments",
    icon: ClipboardList,
  },
];

export function CoordinatorSidebar() {
  const [user, setUser] = useState<ISessionData>({email: "", name: "", role: "", userId: 0});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchSession() {
      const session = await getSession();
      setUser(session);
    }
    fetchSession();
  }, []);

  function handleLogout() {
    setShowLogoutModal(true);
  }

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await deleteSession();
      router.push("/sign-in");
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <Sidebar className={`${isCollapsed ? 'w-16' : 'w-64'} min-h-screen bg-white border-r border-gray-200 shadow-sm z-50 transition-all duration-300`}>
      <SidebarHeader className="bg-green-800 flex items-center justify-center h-[75px] relative">
        <Image
          src="/img/cca-logo.png"
          alt="CCA Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 h-6 w-6 shadow-sm hover:bg-gray-100"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </SidebarHeader>

      <SidebarContent className={`${isCollapsed ? 'px-2' : 'px-4'} py-6 space-y-4`}>
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'} transition-colors ${
                        isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <a href={item.url} title={isCollapsed ? item.title : undefined}>
                        <item.icon className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5`} />
                        {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`${isCollapsed ? 'px-2' : 'px-4'} py-4 border-t border-gray-200`}>
        {!isCollapsed ? (
          <>
            <div className="px-3 py-2 mb-2 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{user.name || 'Loading...'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </SidebarFooter>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onConfirm={confirmLogout}
        onClose={cancelLogout}
        isLoading={isLoggingOut}
      />
    </Sidebar>
  );
}

