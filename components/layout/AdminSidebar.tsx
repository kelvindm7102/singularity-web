"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, Upload, LayoutDashboard, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/songs", label: "Songs", icon: Library },
  { href: "/admin/imports", label: "Imports", icon: Upload },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full border-r border-[#82aadc33] bg-surface relative z-10">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#82aadc33]">
        <h1 className="text-xl tracking-widest text-[#F2F7FF] font-display font-semibold uppercase">
          Singularity
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 flex flex-col gap-8">
        <div className="space-y-4">
          <div className="px-2 text-xs font-mono text-[#A9B7CC] tracking-widest uppercase">
            Library
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 relative group
                    ${isActive ? "text-[#18D8FF]" : "text-[#A9B7CC] hover:text-[#F2F7FF] hover:bg-[#1557C0]/10"}
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#18D8FF] shadow-[0_0_12px_rgba(24,216,255,0.4)]" />
                  )}
                  <Icon className="w-4 h-4" />
                  <span className="font-medium tracking-wide uppercase">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Future Settings placeholder */}
        <div className="space-y-4">
          <div className="px-2 text-xs font-mono text-[#A9B7CC] tracking-widest uppercase">
            System
          </div>
          <div className="space-y-1">
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 text-sm text-[#A9B7CC] hover:text-[#F2F7FF] hover:bg-[#1557C0]/10 transition-all duration-200 relative group"
            >
              <Settings className="w-4 h-4" />
              <span className="font-medium tracking-wide uppercase">Settings</span>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Footer Info */}
      <div className="p-4 border-t border-[#82aadc33] text-xs font-mono text-[#64748B]">
        SYSTEM.v1
      </div>
    </aside>
  );
}
