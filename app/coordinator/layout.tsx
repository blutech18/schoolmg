import { SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { CoordinatorSidebar } from "./components/CoordinatorSidebar";

export const metadata: Metadata = {
  title: "Program Coordinator | City College of Angeles",
};

export default async function CoordinatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="min-h-screen w-full flex bg-white">
      <SidebarProvider>
        <CoordinatorSidebar />
        <div className="flex-1 ml-64 overflow-hidden">
          <main className="w-full min-h-screen">
            <div className="px-6 py-6 w-full mx-auto max-w-[1400px]">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

