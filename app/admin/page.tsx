"use client";

import Link from "next/link";
import { HardDrive, Server, FileAudio, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: adminApi.getStats,
    refetchInterval: 10000,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["adminHistory"],
    queryFn: adminApi.getImportHistory,
    refetchInterval: 10000,
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full flex flex-col h-full">
      <header className="mb-12 border-b border-[#82aadc33] pb-4 flex items-end justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display uppercase tracking-wider text-[#F2F7FF] mb-2 flex items-center gap-3">
            <div className="w-2 h-6 bg-[#18D8FF] shadow-[0_0_12px_rgba(24,216,255,0.4)]" />
            System Console
          </h1>
          <p className="text-[#A9B7CC] font-mono text-sm">ADMIN / OVERVIEW</p>
        </div>
        <div className="text-xs font-mono flex items-center gap-2">
          {stats?.health === "OK" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-[#18D8FF] shadow-[0_0_8px_rgba(24,216,255,0.8)] animate-pulse" />
              <span className="text-[#18D8FF]">SYSTEM ONLINE</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              <span className="text-red-400">SYSTEM OFFLINE</span>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 shrink-0">
        <div className="border border-[#82aadc33] bg-[#080E1C]/80 p-6 relative group flex flex-col">
          <div className="absolute top-0 left-0 w-8 h-[1px] bg-[#18D8FF]" />
          <div className="absolute top-0 left-0 w-[1px] h-8 bg-[#18D8FF]" />
          
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-mono text-sm tracking-widest text-[#A9B7CC] uppercase">Library</h3>
            <HardDrive className="w-5 h-5 text-[#2494FF]" />
          </div>
          <div className="text-4xl font-display font-light text-[#F2F7FF] flex-1">
            {statsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#18D8FF] inline-block" />
            ) : (
              stats?.totalSongs ?? "--"
            )}
            <span className="text-sm font-mono text-[#64748B] ml-2">SONGS</span>
          </div>
          
          <div className="mt-6 text-sm font-mono text-[#64748B]">
            {statsLoading ? "--" : (stats?.totalStorageBytes ? (stats.totalStorageBytes / 1024 / 1024).toFixed(2) : "0")} MB USED
          </div>
          <Link href="/admin/songs" className="mt-2 text-sm text-[#18D8FF] font-mono hover:underline inline-flex items-center gap-2">
            BROWSE LIBRARY &rarr;
          </Link>
        </div>

        <div className="border border-[#82aadc33] bg-[#080E1C]/80 p-6 relative group flex flex-col">
          <div className="absolute top-0 right-0 w-8 h-[1px] bg-[#18D8FF]" />
          <div className="absolute top-0 right-0 w-[1px] h-8 bg-[#18D8FF]" />
          
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-mono text-sm tracking-widest text-[#A9B7CC] uppercase">Import Queue</h3>
            <FileAudio className="w-5 h-5 text-[#2494FF]" />
          </div>
          <div className="text-4xl font-display font-light text-[#F2F7FF] flex-1">
            {statsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#18D8FF] inline-block" />
            ) : (
              stats?.activeImportJobs ?? "--"
            )}
            <span className="text-sm font-mono text-[#64748B] ml-2">ACTIVE</span>
          </div>
          
          <Link href="/admin/imports" className="mt-8 text-sm text-[#18D8FF] font-mono hover:underline inline-flex items-center gap-2">
            IMPORT SPK &rarr;
          </Link>
        </div>

        <div className="border border-[#82aadc33] bg-[#080E1C]/80 p-6 relative group flex flex-col">
          <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-[#18D8FF]" />
          <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-[#18D8FF]" />
          
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-mono text-sm tracking-widest text-[#A9B7CC] uppercase">System</h3>
            <Server className="w-5 h-5 text-[#2494FF]" />
          </div>
          <div className="text-4xl font-display font-light text-[#F2F7FF] flex-1">
            {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#18D8FF]" /> : (stats?.health || "--")}
          </div>
          
          <div className="mt-8 text-sm text-[#64748B] font-mono">
            {stats?.health === "OK" ? "ALL SERVICES NORMAL" : "DEGRADED PERFORMANCE"}
          </div>
        </div>
      </div>

      <div className="border border-[#82aadc33] bg-[#080E1C]/60 p-6 flex-1 flex flex-col min-h-0">
        <h3 className="font-mono text-sm tracking-widest text-[#A9B7CC] mb-6 uppercase border-b border-[#82aadc33] pb-2 shrink-0">
          Recent Import Activity
        </h3>
        <div className="flex-1 overflow-auto">
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#18D8FF]">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <span className="font-mono text-sm">LOADING ACTIVITY...</span>
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map((job) => (
                <div key={job.jobId} className="flex items-center justify-between p-3 border border-[#82aadc1a] bg-[#0B1324] font-mono text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-[#64748B] text-xs w-20 truncate">{job.jobId.split("-")[0]}</span>
                    <span className={job.status === "SUCCESS" ? "text-green-400" : job.status === "FAILED" ? "text-red-400" : "text-[#18D8FF]"}>
                      {job.status}
                    </span>
                  </div>
                  {job.songId && (
                    <Link href={`/admin/songs/${job.songId}`} className="text-[#18D8FF] hover:underline">
                      VIEW SONG
                    </Link>
                  )}
                  {job.errorMessage && (
                    <span className="text-red-400 text-xs truncate max-w-xs">{job.errorMessage}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[#64748B] font-mono text-sm">
              No recent activity to report.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
