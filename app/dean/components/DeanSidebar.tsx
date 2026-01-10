"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FileText, Users, TrendingUp, LogOut, Calculator, UserCheck, BookOpen, Calendar, Award, ClipboardList } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getSession, deleteSession, ISessionData } from "@/helpers/session";
import { useEffect, useState } from "react";
import { LogoutConfirmationModal } from "@/components/ui/logout-confirmation-modal";

type DeanItem = {
  title: string;
  url: string;
  icon: any;
};

const deanItems: DeanItem[] = [
  { title: "Dashboard", url: "/dean", icon: BarChart3 },
  { title: "Analytics", url: "/dean/analytics", icon: TrendingUp },
  { title: "Courses", url: "/dean/courses", icon: Award },
  { title: "Subjects", url: "/dean/subjects", icon: BookOpen },
  { title: "Excuse Letters", url: "/dean/excuse-letters", icon: FileText },
  { title: "Student Performance", url: "/dean/student-performance", icon: Users },
  { title: "Grading Sheets", url: "/dean/grades", icon: Calculator },
  { title: "Attendance Sheets", url: "/dean/attendance", icon: UserCheck },
];

export function DeanSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ISessionData>({ email: "", name: "", role: "", userId: 0 });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const currentPath = pathname;

  return (
    <Sidebar className="w-64 min-h-screen bg-white border-r border-gray-200 shadow-sm z-40 fixed left-0 top-0">
      <SidebarContent className="px-4 py-6 space-y-4 mt-[75px]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {deanItems.map((item) => {
                const isActive = currentPath === item.url || (item.url !== "/dean" && currentPath.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`w-full justify-start transition-colors ${isActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "hover:bg-gray-100"
                        }`}
                    >
                      <a href={item.url}>
                        <item.icon className="mr-3 h-5 w-5" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 border-t border-gray-200">
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
      </SidebarFooter>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
        isLoading={isLoggingOut}
      />
    </Sidebar>
  );
}


