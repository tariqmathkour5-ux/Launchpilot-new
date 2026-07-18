"use client";

import { useEffect, useState } from "react";
import { Image, Upload, FolderPlus, FileIcon } from "lucide-react";

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mimeType: string) => mimeType.startsWith("image/");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Media Library</h1>
          <p className="text-secondary-500 mt-1">Manage uploaded files and images</p>
        </div>
        <button className="btn btn-primary">
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <div key={file.id} className="card p-3 group relative">
              <div className="aspect-square rounded-lg bg-secondary-100 flex items-center justify-center overflow-hidden">
                {isImage(file.mimeType) ? (
                  <img
                    src={file.url}
                    alt={file.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileIcon className="h-12 w-12 text-secondary-400" />
                )}
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium text-secondary-900 truncate">{file.originalName}</p>
                <p className="text-xs text-secondary-500">{formatSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && !isLoading && (
        <div className="card p-12 text-center">
          <Image className="h-12 w-12 mx-auto text-secondary-300 mb-4" />
          <p className="text-secondary-500">No files uploaded yet</p>
        </div>
      )}
    </div>
  );
}
