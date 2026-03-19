"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Id } from "../../../convex/_generated/dataModel";

interface UploadedFile {
  ufsUrl: string;
  name: string;
  fileId?: Id<"files">;
}

interface TranscriptionResponse {
  url: string;
  transcription: string;
}

interface ApiError {
  error: string;
  details?: string;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "sw", label: "Swahili" },
] as const;

type LanguageCode = typeof LANGUAGES[number]["code"];

export default function TranscriptionPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [transcription, setTranscription] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string>("");
  const [ready, setReady] = useState(false);

  // Load uploaded file from sessionStorage on mount
  useEffect(() => {
    const raw = sessionStorage.getItem("uploadedFile");
    if (raw) {
      try {
        setUploadedFile(JSON.parse(raw));
      } catch {
        // ignore malformed data
      }
    }
    // Also restore any previous transcription result
    const prevResult = sessionStorage.getItem("transcription");
    if (prevResult) {
      try {
        const parsed = JSON.parse(prevResult);
        setTranscription(parsed.text ?? "");
      } catch {
        // ignore
      }
    }
    setReady(true);
  }, []);

  const handleTranscribe = async () => {
    if (!uploadedFile) return;
    setIsTranscribing(true);
    setError("");
    setTranscription("");

    try {
      const response = await axios.post<TranscriptionResponse>("/api/transcribe", {
        url: uploadedFile.ufsUrl,
        language,
        fileId: uploadedFile.fileId, // sent to server so route.ts can call Convex mutation
      });

      const text = response.data.transcription;
      setTranscription(text);
      sessionStorage.setItem(
        "transcription",
        JSON.stringify({
          text,
          language: LANGUAGES.find((l) => l.code === language)?.label ?? language,
          fileName: uploadedFile.name,
        })
      );

      // Convex mutation is called server-side in route.ts
    } catch (err) {
      const message = axios.isAxiosError<ApiError>(err)
        ? err.response?.data?.error || "Transcription failed"
        : "An unexpected error occurred";
      setError(message);
    } finally {
      setIsTranscribing(false);
    }
  };

  if (!ready) return null;

  // Parse utterances for formatted display
  const utterances = transcription
    .split(/(?=Speaker [A-Z]:)/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <Link
          href="/upload"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6 gap-1"
        >
          ← Upload another file
        </Link>

        {/* File info + controls */}
        {uploadedFile ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-semibold">File:</span> {uploadedFile.name}
            </p>
            <p className="text-xs text-gray-400 mb-4 break-all">{uploadedFile.ufsUrl}</p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transcription Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              disabled={isTranscribing}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isTranscribing
                ? `Transcribing in ${LANGUAGES.find((l) => l.code === language)?.label}...`
                : "Transcribe"}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mb-6">
            <p className="text-gray-600 mb-4">No file found. Please upload a file first.</p>
            <Link
              href="/upload"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload a file
            </Link>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Transcription result */}
        {transcription && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-bold text-gray-800">Transcription</h1>
              <p className="text-xs text-gray-400 mt-1">
                Detected: {LANGUAGES.find((l) => l.code === language)?.label}
                {uploadedFile && <> &nbsp;·&nbsp; {uploadedFile.name}</>}
              </p>
            </div>

            <div className="space-y-5">
              {utterances.map((utterance, i) => {
                const colonIdx = utterance.indexOf(":");
                const label = colonIdx !== -1 ? utterance.slice(0, colonIdx + 1) : "";
                const body = colonIdx !== -1 ? utterance.slice(colonIdx + 1).trim() : utterance;
                return (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed">
                    {label && (
                      <span className="font-semibold text-gray-900">{label} </span>
                    )}
                    {body}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
