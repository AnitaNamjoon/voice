"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

interface TranscriptionResponse {
    url: string;
    transcription: string;
    detectedLanguage?: string;
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

type LanguageCode = (typeof LANGUAGES)[number]["code"];

function TranscribeContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get("url");
    const name = searchParams.get("name");

    const [transcription, setTranscription] = useState<string>("");
    const [detectedLanguage, setDetectedLanguage] = useState<string>("");
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string>("");
    const [language, setLanguage] = useState<LanguageCode>("en");

    const handleTranscribe = async () => {
        if (!url) return;

        setIsTranscribing(true);
        setError("");
        setTranscription("");
        setDetectedLanguage("");

        try {
            const response = await axios.post<TranscriptionResponse>(
                "/api/transcribe",
                {
                    url,
                    language,
                },
            );

            setTranscription(response.data.transcription);
            setDetectedLanguage(response.data.detectedLanguage ?? "");
        } catch (err) {
            const message = axios.isAxiosError<ApiError>(err)
                ? err.response?.data?.error || "Transcription failed"
                : "An unexpected error occurred";
            setError(message);
        } finally {
            setIsTranscribing(false);
        }
    };

    if (!url) {
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-600">No file provided for transcription.</p>
                <a href="/upload" className="text-blue-600 hover:underline mt-4 block">
                    Go to Upload
                </a>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-2xl">
            <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">Transcribe File</h2>
                <div className="space-y-3 mb-6">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold">File:</span> {name}
                    </p>
                    <p className="text-xs text-gray-400 break-all">{url}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Target Language
                        </label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                            disabled={isTranscribing}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleTranscribe}
                        disabled={isTranscribing}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isTranscribing
                            ? `Transcribing in ${LANGUAGES.find((l) => l.code === language)?.label}...`
                            : "Start Transcription"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="w-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {transcription && (
                <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700">Transcription Result</h3>
                        {detectedLanguage && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                Original: {detectedLanguage}
                            </span>
                        )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded border border-gray-100 min-h-[100px]">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{transcription}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TranscribePage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
            <Suspense fallback={<div>Loading...</div>}>
                <TranscribeContent />
            </Suspense>
        </main>
    );
}
