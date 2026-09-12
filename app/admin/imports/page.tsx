"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileArchive, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { importsApi } from "@/lib/api/imports";
import { Button } from "@/components/ui/Button";

type UploadState = "IDLE" | "UPLOADING" | "POLLING" | "SUCCESS" | "FAILED";

export default function ImportsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("IDLE");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => importsApi.uploadSpk(file),
    onSuccess: (data) => {
      setJobId(data.jobId);
      setUploadState("POLLING");
    },
    onError: (err: any) => {
      setUploadState("FAILED");
      setErrorMsg(err.message || "Failed to upload SPK package.");
    }
  });

  const { data: jobStatus } = useQuery({
    queryKey: ["importJob", jobId],
    queryFn: () => importsApi.checkStatus(jobId!),
    enabled: !!jobId && uploadState === "POLLING",
    refetchInterval: (query) => {
      const state = query.state.data?.status;
      if (state === "SUCCESS" || state === "FAILED") return false;
      return 2000; // Poll every 2s
    },
  });

  useEffect(() => {
    if (jobStatus) {
      if (jobStatus.status === "SUCCESS") {
        setUploadState("SUCCESS");
      } else if (jobStatus.status === "FAILED") {
        setUploadState("FAILED");
        setErrorMsg(jobStatus.errorMessage || "Processing failed on server.");
      }
    }
  }, [jobStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".spk")) {
      setSelectedFile(file);
      setUploadState("IDLE");
      setErrorMsg(null);
      setJobId(null);
    } else if (file) {
      alert("Please select a valid .spk file.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState !== "IDLE" && uploadState !== "FAILED") return;
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".spk")) {
      setSelectedFile(file);
      setUploadState("IDLE");
      setErrorMsg(null);
      setJobId(null);
    } else if (file) {
      alert("Please drop a valid .spk file.");
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setUploadState("UPLOADING");
    uploadMutation.mutate(selectedFile);
  };

  const reset = () => {
    setSelectedFile(null);
    setUploadState("IDLE");
    setJobId(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full h-full flex flex-col">
      <header className="mb-12 shrink-0">
        <h1 className="text-2xl font-display uppercase tracking-wider text-[#F2F7FF] mb-2 flex items-center gap-3">
          <div className="w-2 h-6 bg-[#18D8FF] shadow-[0_0_12px_rgba(24,216,255,0.4)]" />
          Import Packages
        </h1>
        <p className="text-[#A9B7CC] font-mono text-sm">Upload .spk files to add songs to the library</p>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto justify-center pb-20">
        {/* Dropzone */}
        {(uploadState === "IDLE" || uploadState === "FAILED") && (
          <div 
            className={`border-2 border-dashed border-[#82aadc33] bg-[#080E1C]/60 hover:bg-[#080E1C] hover:border-[#18D8FF]/50 transition-all p-16 flex flex-col items-center justify-center relative group cursor-pointer ${selectedFile ? 'border-[#18D8FF]/50 bg-[#080E1C]' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[#18D8FF]/50 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#18D8FF]/50 pointer-events-none" />
            
            <input 
              type="file" 
              accept=".spk" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            {!selectedFile ? (
              <>
                <div className="w-16 h-16 rounded-full bg-[#1557C0]/10 flex items-center justify-center mb-6 text-[#18D8FF] group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-[#F2F7FF] font-display uppercase tracking-wider mb-2">Select SPK Package</h3>
                <p className="text-[#64748B] font-mono text-sm text-center">Drag and drop your .spk file here,<br/>or click to browse</p>
              </>
            ) : (
              <>
                <FileArchive className="w-16 h-16 text-[#18D8FF] mb-6" />
                <h3 className="text-[#F2F7FF] font-mono text-lg mb-2">{selectedFile.name}</h3>
                <p className="text-[#A9B7CC] font-mono text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            )}
          </div>
        )}

        {/* Upload & Polling State */}
        {(uploadState === "UPLOADING" || uploadState === "POLLING") && (
          <div className="border border-[#82aadc33] bg-[#080E1C]/80 p-12 flex flex-col items-center justify-center relative">
            <Loader2 className="w-12 h-12 text-[#18D8FF] animate-spin mb-6" />
            <h3 className="text-[#F2F7FF] font-display uppercase tracking-wider mb-2">
              {uploadState === "UPLOADING" ? "Uploading Package..." : "Processing Package..."}
            </h3>
            <p className="text-[#A9B7CC] font-mono text-sm">
              {selectedFile?.name}
            </p>
            {uploadState === "POLLING" && (
              <p className="text-[#64748B] font-mono text-xs mt-4">
                The server is unpacking and validating the song data.
              </p>
            )}
          </div>
        )}

        {/* Success State */}
        {uploadState === "SUCCESS" && (
          <div className="border border-[#82aadc33] bg-[#080E1C]/80 p-12 flex flex-col items-center justify-center relative">
            <CheckCircle2 className="w-16 h-16 text-green-400 mb-6" />
            <h3 className="text-[#F2F7FF] font-display uppercase tracking-wider mb-2">Import Successful</h3>
            <p className="text-[#A9B7CC] font-mono text-sm mb-8">
              {selectedFile?.name} has been added to your library.
            </p>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={reset}>Import Another</Button>
              {jobStatus?.songId && (
                <Button onClick={() => router.push(`/admin/songs/${jobStatus.songId}`)}>View Song</Button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons (visible when file is selected and not processing) */}
        {selectedFile && uploadState !== "SUCCESS" && uploadState !== "UPLOADING" && uploadState !== "POLLING" && (
          <div className="mt-8 flex justify-end gap-4 border-t border-[#82aadc33] pt-6">
            <Button variant="ghost" onClick={reset}>Cancel</Button>
            <Button onClick={handleUpload}>Start Import</Button>
          </div>
        )}

          {/* Error message */}
        {uploadState === "FAILED" && errorMsg && (
          <div className="mt-6 p-4 border border-red-500/30 bg-red-900/10 flex items-start gap-3 text-red-400">
            <XCircle className="w-5 h-5 shrink-0" />
            <div>
              <h4 className="font-mono text-sm font-bold uppercase tracking-wider mb-1">Import Failed</h4>
              <p className="font-mono text-xs">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* History List */}
        <div className="mt-16 border-t border-[#82aadc33] pt-12">
          <h2 className="text-sm font-mono tracking-widest text-[#A9B7CC] mb-6 uppercase flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#18D8FF]" />
            Import History
          </h2>
          <HistoryList />
        </div>
      </div>
    </div>
  );
}

function HistoryList() {
  const router = useRouter();
  const { data: history, isLoading } = useQuery({
    queryKey: ["importHistory"],
    queryFn: () => fetch('/api/admin/import/history').then(res => res.json()), // We can also use adminApi.getImportHistory() if imported
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#18D8FF]" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center p-8 text-[#64748B] font-mono text-sm border border-[#82aadc1a] bg-[#080E1C]/40">
        No past imports found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((job: any) => (
        <div key={job.jobId} className="flex items-center justify-between p-4 border border-[#82aadc1a] bg-[#0B1324] font-mono text-sm hover:border-[#18D8FF]/30 transition-colors">
          <div className="flex items-center gap-6">
            <div className="w-24 text-[#64748B] truncate" title={job.jobId}>
              {job.jobId.split("-")[0]}
            </div>
            <div className={`w-24 ${job.status === "SUCCESS" ? "text-green-400" : job.status === "FAILED" ? "text-red-400" : "text-[#18D8FF]"}`}>
              {job.status}
            </div>
          </div>
          
          <div className="flex-1 px-4 text-[#A9B7CC] truncate">
            {job.errorMessage ? (
              <span className="text-red-400/80 text-xs">{job.errorMessage}</span>
            ) : job.songId ? (
              <span className="text-xs">Song ID: {job.songId}</span>
            ) : null}
          </div>

          <div>
            {job.songId && (
              <Button variant="ghost" className="h-8 text-xs text-[#18D8FF]" onClick={() => router.push(`/admin/songs/${job.songId}`)}>
                VIEW
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
