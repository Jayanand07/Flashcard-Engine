"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deckId: string) => void;
}

type UploadStep = "idle" | "reading" | "generating" | "saving" | "success";

const STEPS: { key: Exclude<UploadStep, "idle" | "success">; label: string }[] = [
  { key: "reading", label: "Reading your PDF" },
  { key: "generating", label: "Generating flashcards with AI" },
  { key: "saving", label: "Saving your deck" },
];

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [deckName, setDeckName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<UploadStep>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") { setError("Please select a PDF file."); setSelectedFile(null); return; }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type !== "application/pdf") { setError("Please drop a valid PDF file."); return; }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName.trim()) { setError("Deck name is required."); return; }
    if (!selectedFile) { setError("Please select a PDF file."); return; }

    setIsUploading(true);
    setError(null);
    setCurrentStep("reading");

    try {
      const formData = new FormData();
      formData.append("name", deckName);
      formData.append("pdf", selectedFile);

      setTimeout(() => setCurrentStep("generating"), 1200);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server error: ${text}`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setCurrentStep("saving");
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStep("success");

      setTimeout(() => {
        onSuccess(data.deckId);
        router.push(`/deck/${data.deckId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsUploading(false);
      setCurrentStep("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={!isUploading ? onClose : undefined}>
      <div
        className="w-full max-w-lg animate-fade-up rounded-2xl p-8 shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {currentStep === "success" ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="animate-scale-in mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Flashcards generated!</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Redirecting to your deck...</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Upload PDF</h2>
            <p className="mt-1 mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>AI will generate smart flashcards from your PDF.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Deck Name</label>
                <input
                  type="text" value={deckName} onChange={(e) => setDeckName(e.target.value)} disabled={isUploading}
                  placeholder="e.g. Biology Chapter 1"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2"
                  style={{ background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>File</label>
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={!isUploading ? handleDrop : undefined}
                  className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-8 transition-colors"
                  style={{ borderColor: selectedFile ? "var(--accent)" : "var(--border)", background: "var(--surface-2)" }}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                  <svg className="mb-2 h-8 w-8" style={{ color: selectedFile ? "var(--accent)" : "var(--text-secondary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {selectedFile ? selectedFile.name : "Click or drag PDF here"}
                  </span>
                </div>
              </div>

              {error && <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

              {isUploading && (
                <div className="space-y-2.5 rounded-xl p-4" style={{ background: "var(--surface-2)" }}>
                  {STEPS.map((step) => {
                    const all: UploadStep[] = ["reading", "generating", "saving"];
                    const ci = all.indexOf(currentStep as typeof step.key);
                    const si = all.indexOf(step.key);
                    const isDone = si < ci;
                    const isActive = step.key === currentStep;
                    return (
                      <div key={step.key} className="flex items-center gap-2.5 text-sm" style={{ color: isActive ? "var(--text-primary)" : isDone ? "var(--success)" : "var(--text-secondary)", opacity: isActive || isDone ? 1 : 0.4 }}>
                        {isDone ? (
                          <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : isActive ? (
                          <svg className="h-4 w-4 animate-spin" style={{ color: "var(--accent)" }} viewBox="0 0 24 24" fill="none"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        ) : <div className="h-2 w-2 rounded-full" style={{ background: "var(--border)" }} />}
                        <span className={isDone ? "line-through" : ""}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={onClose} disabled={isUploading} className="btn-ghost flex-1 py-2.5 text-sm disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isUploading} className="btn-accent flex-1 py-2.5 text-sm disabled:opacity-60">{isUploading ? "Processing..." : "Generate Cards"}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
