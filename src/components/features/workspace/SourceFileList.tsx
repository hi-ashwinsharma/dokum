"use client";

import { File as FileIcon, Image as ImageIcon, X, Plus } from "lucide-react";

interface SourceFile {
  id: string;
  file: File;
  pageCount: number;
}

interface SourceFileListProps {
  files: SourceFile[];
  onRemove: (id: string) => void;
  onAddSegment: (fileId: string) => void;
}

export function SourceFileList({ files, onRemove, onAddSegment }: SourceFileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {files.map((item, index) => {
        // Android notification shade style grouping
        let roundClass = "rounded-interactive";
        if (files.length === 1) {
          roundClass = "rounded-[20px]";
        } else if (index === 0) {
          roundClass = "rounded-t-[20px] rounded-b-[6px]";
        } else if (index === files.length - 1) {
          roundClass = "rounded-b-[20px] rounded-t-[6px]";
        } else {
          roundClass = "rounded-[6px]";
        }

        return (
          <div
            key={item.id}
            className={`group flex items-center gap-3 bg-bg-surface-variant p-3.5 transition-all duration-280 hover:bg-bg-surface-variant/80 cursor-pointer border border-border-subtle/10 ${roundClass}`}
            onClick={() => onAddSegment(item.id)}
            role="button"
            tabIndex={0}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-interactive bg-accent-blue/10 text-accent-blue shadow-sm shrink-0">
              {item.file.type.startsWith('image/') ? (
                <ImageIcon className="h-5 w-5 stroke-[1.5px]" />
              ) : (
                <FileIcon className="h-5 w-5 stroke-[1.5px]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-text-primary leading-tight">
                {item.file.name}
              </p>
              <p className="text-[10px] text-text-muted mt-1 font-mono">
                {item.pageCount === 0 ? "Loading..." : `${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'}`}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-red-400 transition-opacity rounded-full hover:bg-bg-surface/50"
            >
              <X className="h-4 w-4 stroke-[1.5px]" />
            </button>

            <div className="opacity-0 group-hover:opacity-100 text-accent-blue transition-opacity pr-1">
              <Plus className="h-5 w-5 stroke-[2px]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
