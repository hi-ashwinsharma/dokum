"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, X, FileText } from "lucide-react";
import { TextField } from "@/components/ui/TextField";

interface SequenceItemProps {
  id: string;
  fileName: string;
  range: string;
  onRangeChange: (newRange: string) => void;
  onRemove: () => void;
  className?: string;
}

export function SequenceItem({ id, fileName, range, onRangeChange, onRemove, className }: SequenceItemProps) {
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
      className={cn(
        "relative flex items-center gap-3 bg-bg-surface-variant/40 border border-border-subtle/10 p-4 transition-all duration-280 rounded-interactive",
        isDragging && "shadow-soft_elevation ring-2 ring-accent-blue bg-bg-surface",
        className
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-text-muted/60 hover:text-text-secondary p-1">
        <GripVertical className="h-5 w-5 stroke-[1.5px]" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] text-text-secondary uppercase font-bold tracking-wider">
          <FileText className="h-3.5 w-3.5 stroke-[1.5px]" />
          <span className="truncate">{fileName}</span>
        </div>

        <TextField
          value={range}
          onChange={(e) => onRangeChange(e.target.value)}
          placeholder="e.g. 1-5, 8"
          className="h-9 text-xs mt-1"
        />
      </div>

      <button
        onClick={onRemove}
        className="text-text-muted hover:text-red-400 p-2 transition-colors cursor-pointer"
      >
        <X className="h-4.5 w-4.5 stroke-[1.5px]" />
      </button>
    </div>
  );
}
