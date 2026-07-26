"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { X, Wand2 } from "lucide-react";
import { UploadDropzone } from "@/utils/uploadThing";
import { removeImageBackground, compressImage } from "@/utils/utils";
import Image from "next/image";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploader({ value, onChange, label = "Imagen" }: ImageUploaderProps) {
  const [shouldRemoveBg, setShouldRemoveBg] = useState(false);
  const [processing, setProcessing] = useState(false);

  const displayUrl = value;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
          {label}
        </label>

        <label className="flex items-center gap-2 cursor-pointer group">
          <div className={`flex items-center justify-center w-5 h-5 rounded border transition-colors ${shouldRemoveBg ? 'bg-violet-600 border-violet-600' : 'bg-neutral-900 border-neutral-700 group-hover:border-neutral-500'}`}>
            {shouldRemoveBg && <Wand2 size={12} className="text-white" />}
          </div>
          <span className="text-xs text-neutral-300 group-hover:text-neutral-200 transition-colors">
            Quitar fondo automáticamente (IA)
          </span>
          <input
            type="checkbox"
            className="hidden"
            checked={shouldRemoveBg}
            onChange={(e) => setShouldRemoveBg(e.target.checked)}
          />
        </label>
      </div>

      {displayUrl && !processing && (
        <div className="relative w-full h-40 rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950 bg-[radial-gradient(circle,_#333_1px,_transparent_1px)] bg-[size:12px_12px]">
          <Image
            src={displayUrl}
            alt="Preview"
            fill
            className="object-contain p-2"
            unoptimized
          />
          <button
            type="button"
            onClick={() => {
              onChange("");
            }}
            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer"
            title="Quitar imagen"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {(!displayUrl || processing) && (
        <div className="w-full relative">
          <UploadDropzone
            endpoint="imageUploader"
            className={`ut-button:bg-blue-600 ut-button:ut-readying:bg-blue-600/50 ut-button:ut-uploading:bg-blue-600/50 ut-label:text-blue-500 border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 transition-colors ${processing ? 'opacity-50 pointer-events-none' : ''}`}
            onBeforeUploadBegin={async (files) => {
              setProcessing(true);
              let targetFile = files[0];

              if (shouldRemoveBg) {
                toast.loading("Procesando imagen (quitando fondo)...", { id: "img-prep" });
                try {
                  targetFile = await removeImageBackground(targetFile);
                } catch {
                  toast.error("Error al quitar el fondo, usando versión original...", { id: "img-prep" });
                }
              }

              toast.loading("Optimizando y comprimiendo imagen...", { id: "img-prep" });
              try {
                const compressed = await compressImage(targetFile);
                toast.success("Imagen optimizada, subiendo a UploadThing...", { id: "img-prep" });
                return [compressed];
              } catch {
                toast.success("Subiendo imagen...", { id: "img-prep" });
                return [targetFile];
              }
            }}
            onClientUploadComplete={(res) => {
              setProcessing(false);
              const url = res?.[0]?.ufsUrl ?? res?.[0]?.url ?? "";
              onChange(url);
              toast.success("Imagen subida correctamente");
            }}
            onUploadError={(err) => {
              setProcessing(false);
              toast.error("Error al subir imagen: " + err.message);
            }}
          />
        </div>
      )}
    </div>
  );
}
