import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deckId: string) => void;
}

type UploadStep = "idle" | "reading" | "generating" | "saving" | "success";

const STEPS: { key: UploadStep; label: string }[] = [
  { key: "reading", label: "Reading your PDF" },
  { key: "generating", label: "Generating flashcards with AI" },
  { key: "saving", label: "Saving your deck" },
];

export default function UploadModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadModalProps) {
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
      if (file.type !== "application/pdf") {
        setError("Please select a valid PDF file.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type !== "application/pdf") {
        setError("Please drop a valid PDF file.");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName.trim()) {
      setError("Deck name is required.");
      return;
    }
    if (!selectedFile) {
      setError("Please select a PDF file.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setCurrentStep("reading");

    try {
      const formData = new FormData();
      formData.append("name", deckName);
      formData.append("pdf", selectedFile);

      // Simulate step progression
      setTimeout(() => setCurrentStep("generating"), 1200);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate flashcards");
      }

      setCurrentStep("saving");
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStep("success");

      // Auto-redirect after showing success
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={!isUploading ? onClose : undefined}
    >
      <div
        className="w-full max-w-lg animate-fade-up rounded-xl border border-gray-200 bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Success State ── */}
        {currentStep === "success" ? (
          <div className="flex flex-col items-center py-8 text-center">
            {/* Animated Checkmark */}
            <div className="animate-scale-in mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 animate-success-glow">
              <svg
                className="h-10 w-10 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="animate-fade-up animate-delay-200 text-xl font-semibold tracking-tight text-gray-900">
              Flashcards generated!
            </h2>
            <p className="animate-fade-up animate-delay-300 mt-2 text-sm text-gray-500">
              Redirecting to your new deck...
            </p>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                Upload PDF
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                We&apos;ll extract the content and generate flashcards
                automatically.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Deck Name */}
              <div>
                <label
                  htmlFor="deckName"
                  className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-400"
                >
                  Deck Name
                </label>
                <input
                  id="deckName"
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  disabled={isUploading}
                  placeholder="e.g. Intro to Biology, Chapter 1"
                  className="w-full rounded-xl border border-gray-200 bg-stone-50/50 p-3.5 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-gray-300 focus:bg-white focus:ring-1 focus:ring-gray-300 focus:shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              {/* File Drop Zone */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-400">
                  PDF Document
                </label>
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={!isUploading ? handleDrop : undefined}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200 ${
                    selectedFile
                      ? "border-gray-400 bg-stone-50"
                      : "border-gray-200 hover:border-gray-400 hover:bg-stone-50/50"
                  } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                  />
                  <svg
                    className={`mb-3 h-8 w-8 transition-colors duration-200 ${
                      selectedFile ? "text-gray-600" : "text-gray-300"
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-center text-sm text-gray-500">
                    {selectedFile ? (
                      <span className="font-medium text-gray-900">
                        {selectedFile.name}
                      </span>
                    ) : (
                      <>
                        <span className="font-medium text-gray-700">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </>
                    )}
                  </span>
                  <span className="mt-1 text-xs text-gray-400">
                    PDF up to 10MB
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="animate-fade-up rounded-xl border border-red-100 bg-red-50/80 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* ── Step Progress ── */}
              {isUploading && currentStep !== "success" && !error && (
                <div className="animate-fade-up space-y-3 rounded-xl border border-gray-100 bg-stone-50/50 p-5">
                  {STEPS.map((step) => {
                    const isActive = step.key === currentStep;
                    const stepIndex = STEPS.findIndex(
                      (s) => s.key === currentStep
                    );
                    const thisIndex = STEPS.findIndex(
                      (s) => s.key === step.key
                    );
                    const isDone = thisIndex < stepIndex;

                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-3 transition-all duration-300 ${
                          isActive
                            ? "text-gray-900"
                            : isDone
                            ? "text-gray-400"
                            : "text-gray-300"
                        }`}
                      >
                        {/* Step indicator */}
                        <div className="flex h-6 w-6 items-center justify-center">
                          {isDone ? (
                            <svg
                              className="h-5 w-5 text-emerald-500 animate-scale-in"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : isActive ? (
                            <svg
                              className="h-5 w-5 animate-spin text-gray-600"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-20"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="3"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-gray-300" />
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium transition-all duration-300 ${
                            isDone ? "line-through" : ""
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="mt-2 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="flex-1 rounded-xl py-3 text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-stone-100 hover:text-gray-800 hover:-translate-y-px active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="btn-premium flex-1 rounded-xl py-3 text-sm font-medium disabled:pointer-events-none disabled:opacity-60"
                >
                  {isUploading ? "Processing..." : "Generate Cards"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
