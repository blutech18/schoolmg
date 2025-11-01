import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { ClientSidebar } from "../components/ClientSidebar";

export const metadata: Metadata = {
  title: "Admin | City College of Angeles",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="min-h-screen w-full flex bg-white">
      <SidebarProvider>
        <ClientSidebar />
        <div className="flex-1 overflow-hidden flex justify-center">
          <main className="w-full h-screen overflow-y-auto max-w-[1400px]">
            <div className="px-6 py-6 w-full mx-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}




