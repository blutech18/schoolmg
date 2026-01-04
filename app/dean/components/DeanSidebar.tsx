"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3, FileText, Users, TrendingUp, LogOut, Calculator, UserCheck, BookOpen, Calendar, Award, ClipboardList } from "lucide-react";
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
  const params = useSearchParams();
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
    <Sidebar className="w-64 min-h-screen bg-white border-r border-gray-200 shadow-sm z-50">
      <SidebarHeader className="bg-green-800 flex items-center justify-center h-[75px]">
        <Image src="/img/cca-logo.png" alt="CCA Logo" width={40} height={40} className="object-contain" />
      </SidebarHeader>

      <SidebarContent className="px-4 py-6 space-y-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-gray-500 uppercase tracking-wide mb-2">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {deanItems.map((item) => {
                const isActive = currentPath === item.url || (item.url !== "/dean" && currentPath.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a
                        href={item.url}
                        className={`flex items-center gap-2 transition-colors ${isActive ? "bg-green-100 text-green-900 font-medium" : "text-gray-700 hover:bg-green-100 hover:text-green-900"
                          }`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-gray-300 rounded-full !w-10 !h-10 p-5 flex items-center justify-center font-semibold text-gray-500">
              {user.name?.charAt(0) ?? "?"}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold line-clamp-1">{user.name ?? "Anonymous"}</span>
              <span className="text-xs text-gray-500 line-clamp-1">{user.email ?? "Not signed in"}</span>
            </div>
          </div>

          <div onClick={handleLogout} className="cursor-pointer hover:bg-gray-100 p-1 rounded hover:rotate-6 transition-all">
            <LogOut color="gray" width={18} height={18} />
          </div>
        </div>
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


