"use client";

import { useState } from "react";
import { UploadDropzone } from "@/utils/uploadthing";
import { useRouter } from "next/navigation";

interface UploadedFile {
  ufsUrl: string;
  name: string;
}

export default function UploadPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const handleProceedToTranscription = () => {
    if (!uploadedFile) return;
    const params = new URLSearchParams({
      url: uploadedFile.ufsUrl,
      name: uploadedFile.name,
    });
    router.push(`/transcribe?${params.toString()}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-1 p-2 bg-gray-50">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-600">Upload Files</h1>
        <p className="text-gray-400 mb-2">Upload audio or video files</p>
      </div>

      <UploadDropzone
        endpoint="audioUpload"
        appearance={{
          container: {
            padding: "16px",
            minHeight: "auto",
          },
          label: {
            marginBottom: "8px",
          },
          button: {
            marginTop: "8px",
          },
        }}
        onClientUploadComplete={(res) => {
          if (res?.[0]) {
            setUploadedFile({
              ufsUrl: res[0].ufsUrl,
              name: res[0].name,
            });
            setError("");
          }
        }}
        onUploadError={(uploadError: Error) => {
          setError(`ERROR: ${uploadError.message}`);
        }}
      />

      {uploadedFile && (
        <div className="w-full max-w-md mt-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-sm text-green-600 font-medium mb-3">
              ✓ {uploadedFile.name} uploaded successfully!
            </p>
            <button
              onClick={handleProceedToTranscription}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Transcription
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="w-full max-w-md mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </main>
  );
}
