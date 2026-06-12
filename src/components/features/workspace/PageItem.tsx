"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { X, GripVertical } from "lucide-react";

interface PageItemProps {
  id: string;
  thumbnailSrc?: string;
  pageNumber: number;
  fileName: string;
  onRemove: (id: string) => void;
}

export function PageItem({ id, thumbnailSrc, pageNumber, fileName, onRemove }: PageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex aspect-[3/4] flex-col overflow-hidden rounded-component bg-bg-surface-variant border border-border-subtle/10 transition-all duration-280 hover:shadow-soft_elevation cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-accent-blue"
      )}
    >
      <div className="relative flex-1 bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
        {thumbnailSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={thumbnailSrc} alt={`Page ${pageNumber}`} className="h-full w-full object-contain pointer-events-none" draggable={false} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted">
            <span className="text-[10px] uppercase font-mono tracking-wider">Rendering</span>
          </div>
        )}

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-2 top-2 rounded-full bg-bg-surface/80 p-1.5 text-text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white cursor-pointer shadow-sm"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex h-10 items-center justify-between bg-bg-surface px-3 text-[11px] text-text-secondary">
        <span className="truncate max-w-[80px]" title={fileName}>{fileName}</span>
        <span className="font-mono bg-bg-surface-variant px-1.5 py-0.5 rounded text-[10px] font-semibold">p. {pageNumber}</span>
        <div className="text-text-muted/50">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}
