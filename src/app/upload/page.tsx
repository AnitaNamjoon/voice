
"use client";

import { UploadDropzone } from "@/utils/uploadthing";

export default function AudioUploadPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      {/* Title Section */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Upload Call Recording
        </h1>
        <p className="text-sm text-gray-500 mt-1">Audio only (Max 64MB)</p>
      </div>

      {/* Upload Dropzone */}
      <div className="w-full max-w-xl">
        <UploadDropzone
          endpoint="audioUpload"
          className="ut-upload-icon:hidden ut-label:text-gray-700 ut-button:bg-gray-900 ut-button:text-white border-2 border-dashed border-gray-300 rounded-xl p-8 bg-white"
          onClientUploadComplete={() => {
            alert("Upload Complete!");
          }}
          onUploadError={(error: Error) => {
            alert(`Upload Error: ${error.message}`);
          }}
        />
      </div>
    </main>
  );
}
