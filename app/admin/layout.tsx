import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-[#050914] overflow-hidden text-[#F2F7FF] selection:bg-[#2494FF]/30">
      <AdminSidebar />
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent z-10">
        <div className="absolute inset-0 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
