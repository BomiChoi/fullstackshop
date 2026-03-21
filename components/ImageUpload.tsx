"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface ImageUploadProps {
  currentImageUrl?: string;
  onUploadComplete: (storageId: Id<"_storage">, previewUrl: string) => void;
}

export default function ImageUpload({ currentImageUrl, onUploadComplete }: ImageUploadProps) {
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      // 1. Convex에서 업로드 URL 발급
      const uploadUrl = await generateUploadUrl();

      // 2. 파일을 직접 PUT 요청으로 업로드
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!res.ok) throw new Error("Upload failed");

      // 3. 응답에서 storageId 추출
      const { storageId } = await res.json() as { storageId: Id<"_storage"> };

      // 4. 로컬 미리보기 URL 생성
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      onUploadComplete(storageId, localUrl);
    } catch (err) {
      console.error("Image upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
        uploading ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-400"
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {preview ? (
        <div className="relative aspect-square">
          <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
            <span className="text-white text-sm font-medium">이미지 변경</span>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer p-6">
          {uploading ? (
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-400">클릭하거나 드래그하여 이미지 업로드</span>
              <span className="text-xs text-gray-300">JPG, PNG, WEBP 지원</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
