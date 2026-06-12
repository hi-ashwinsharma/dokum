"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { PDFManager } from "@/services/pdf/pdfManager";
import { PDFRenderer } from "@/services/pdf/pdfRenderer";
import { PDFDocument } from 'pdf-lib';
import { PageItem } from "./PageItem";
import { SourceFileList } from "./SourceFileList";
import { SequenceItem } from "./SequenceItem";
import PluginRequestBoard from "@/components/features/requests/PluginRequestBoard";
import { parsePageRange } from "@/lib/pageParser";
import { Button } from "@/components/ui/Button";
import { 
  FileUp, 
  RefreshCw, 
  RotateCw, 
  FileCheck,
  Search,
  Scissors,
  Hash,
  X,
  FileText
} from "lucide-react";

// Dnd Kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface SourceFile {
  id: string;
  file: File;
  pageCount: number;
}

interface MergeSegment {
  id: string;
  fileId: string;
  range: string;
}

interface VirtualPage {
  id: string; // Unique DND identifier (segmentId + idx)
  segmentId: string;
  fileId: string;
  pageIndex: number; // 0-based
  fileName: string;
  fileType: string;
  thumbnail?: string;
}

export default function Workspace({ 
  activeTool, 
  setActiveTool 
}: { 
  activeTool: "merge" | "rotate" | "split" | "numbers"; 
  setActiveTool: (tool: "merge" | "rotate" | "split" | "numbers") => void; 
}) {
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [segments, setSegments] = useState<MergeSegment[]>([]);
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map()); // Key: `${fileId}-${pageIndex}`
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRequestDrawer, setShowRequestDrawer] = useState(false);
  
  // States for other minor operations
  const [rotationDegrees, setRotationDegrees] = useState<90 | 180 | 270>(90);
  const [splitPageRange, setSplitPageRange] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- Derived State: Virtual Pages ---
  const virtualPages = useMemo(() => {
    const pages: VirtualPage[] = [];
    segments.forEach((seg) => {
      const file = files.find((f) => f.id === seg.fileId);
      if (!file) return;

      const indices = parsePageRange(seg.range, file.pageCount);
      indices.forEach((pageIdx, i) => {
        const uniquePageId = `${seg.id}-${i}-${pageIdx}`;
        const thumbnailKey = `${file.id}-${pageIdx}`;

        pages.push({
          id: uniquePageId,
          segmentId: seg.id,
          fileId: file.id,
          pageIndex: pageIdx,
          fileName: file.file.name,
          fileType: file.file.type,
          thumbnail: thumbnails.get(thumbnailKey),
        });
      });
    });
    return pages;
  }, [segments, files, thumbnails]);

  // --- File Upload Handling ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploadedFiles = Array.from(e.target.files);

    for (const file of uploadedFiles) {
      const fileId = `${file.name}-${Date.now()}-${Math.random()}`;

      // Set initial loading state
      setFiles((prev) => [...prev, { id: fileId, file, pageCount: 0 }]);

      // Read details async
      (async () => {
        let pageCount = 1;
        try {
          if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            const ab = await file.arrayBuffer();
            const pdf = await PDFDocument.load(ab);
            pageCount = pdf.getPageCount();
          }

          // Update file count
          setFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, pageCount } : f))
          );

          // Add a segment by default
          const range = pageCount > 1 ? `1-${pageCount}` : "1";
          setSegments((prev) => [
            ...prev,
            { id: Math.random().toString(36).substr(2, 9), fileId, range },
          ]);

          // Load thumbnails
          if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            for (let i = 0; i < pageCount; i++) {
              try {
                // Render thumbnail with slight delay to not freeze UI
                const dataUrl = await PDFRenderer.renderThumbnail(file, i + 1, 0.4);
                setThumbnails((prev) => {
                  const copy = new Map(prev);
                  copy.set(`${fileId}-${i}`, dataUrl);
                  return copy;
                });
              } catch (err) {
                console.error("Thumbnail load error page", i, err);
              }
            }
          }
        } catch (err) {
          console.error("Error reading file metadata", err);
        }
      })();
    }
  };

  const handleAddSegment = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    const pageCount = file.pageCount;
    const range = pageCount > 1 ? `1-${pageCount}` : "1";
    setSegments((prev) => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), fileId, range },
    ]);
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSegments((prev) => prev.filter((s) => s.fileId !== fileId));
  };

  const handleRemoveSegment = (segmentId: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== segmentId));
  };

  const handleSegmentRangeChange = (segmentId: string, newRange: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segmentId ? { ...s, range: newRange } : s))
    );
  };

  // --- DND handlers ---
  const handleDragEndPageGrid = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = virtualPages.findIndex((p) => p.id === active.id);
    const newIndex = virtualPages.findIndex((p) => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newPageSequence = arrayMove(virtualPages, oldIndex, newIndex);

      // Re-create segments based on page sequence
      const newSegments: MergeSegment[] = newPageSequence.map((page) => ({
        id: Math.random().toString(36).substr(2, 9),
        fileId: page.fileId,
        range: `${page.pageIndex + 1}`,
      }));
      setSegments(newSegments);
    }
  };

  const handleDragEndSequence = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSegments((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  // --- File Actions ---
  const triggerDownload = (bytes: Uint8Array, fileName: string) => {
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const executeMerge = async () => {
    if (virtualPages.length === 0) return;
    setIsProcessing(true);
    try {
      const items = virtualPages.map((page) => {
        const sourceFile = files.find((f) => f.id === page.fileId);
        return {
          file: sourceFile!.file,
          pageIndex: page.pageIndex,
        };
      });

      const mergedBytes = await PDFManager.assemblePDF(items);
      triggerDownload(mergedBytes, "dokum_merged.pdf");
    } catch (err) {
      console.error("Merge failed", err);
      alert("Failed to merge PDF files. Make sure files are not password protected.");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeRotate = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const sourceFile = files[0];
      const rotatedBytes = await PDFManager.rotatePDF(sourceFile.file, rotationDegrees);
      triggerDownload(rotatedBytes, `rotated_${sourceFile.file.name}`);
    } catch (err) {
      console.error("Rotate failed", err);
      alert("Failed to rotate PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeSplit = async () => {
    if (files.length === 0 || !splitPageRange) return;
    setIsProcessing(true);
    try {
      const sourceFile = files[0];
      const indices = parsePageRange(splitPageRange, sourceFile.pageCount);
      if (indices.length === 0) {
        alert("Invalid page range specified.");
        setIsProcessing(false);
        return;
      }
      const splitBytes = await PDFManager.splitPDF(sourceFile.file, indices);
      triggerDownload(splitBytes, `split_${sourceFile.file.name}`);
    } catch (err) {
      console.error("Split failed", err);
      alert("Failed to split PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAddPageNumbers = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const sourceFile = files[0];
      const numberedBytes = await PDFManager.addPageNumbers(sourceFile.file);
      triggerDownload(numberedBytes, `numbered_${sourceFile.file.name}`);
    } catch (err) {
      console.error("Failed to add page numbers", err);
      alert("Failed to add page numbers.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] gap-3.5 p-3.5 overflow-hidden">
      {/* Split Sidebar Wrapper */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-3.5 h-full overflow-hidden relative">
        {/* Card 1: Documents & Uploads */}
        <div className="bg-bg-surface p-4 rounded-container border border-border-subtle/10 shadow-soft_elevation flex flex-col gap-3.5 max-h-[48%] overflow-hidden relative pt-6 shrink-0">

          <div className="flex flex-col gap-1 min-h-0 flex-1 overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary pl-1 mb-1">
              Imported Files
            </h3>
            
            {/* Source Files list (scrollable) */}
            {files.length > 0 ? (
              <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                <SourceFileList
                  files={files}
                  onRemove={handleRemoveFile}
                  onAddSegment={handleAddSegment}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-interactive bg-bg-surface-variant/20 p-4 text-center">
                <p className="text-[11px] text-text-muted leading-relaxed">
                  No files imported. Click upload below to add files.
                </p>
              </div>
            )}
          </div>

          {/* Upload Files Button in place of suggest plugin */}
          <div className="shrink-0">
            <input
              type="file"
              multiple
              accept=".pdf, image/png, image/jpeg, image/jpg"
              className="hidden"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full h-11 border border-dashed border-border-subtle bg-bg-surface-variant/40 hover:bg-bg-surface-variant text-text-primary rounded-pill font-medium flex items-center justify-center gap-2 transition-all duration-280 text-xs shrink-0"
            >
              <FileUp className="w-4 h-4 text-accent-blue stroke-[1.5px]" />
              <span>Upload Files</span>
            </button>
          </div>
        </div>

        {/* Card 2: Tool Configuration & Actions */}
        <div className="bg-bg-surface p-4 rounded-container border border-border-subtle/10 shadow-soft_elevation flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
          {/* Action Panel based on mode */}
          <div className="pt-1 flex-1 flex flex-col min-h-0 overflow-y-auto">
            {activeTool === "merge" && (
              <div className="flex flex-col flex-1 gap-3 min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
                    Sequence blocks
                  </h4>
                  <span className="text-[10px] bg-bg-surface-variant px-2 py-0.5 rounded font-mono">
                    {segments.length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEndSequence}
                  >
                    <SortableContext
                      items={segments.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-1.5">
                        {segments.map((segment, index) => {
                          // Android notifications group-rounding
                          let roundClass = "rounded-interactive";
                          if (segments.length === 1) {
                            roundClass = "rounded-[20px]";
                          } else if (index === 0) {
                            roundClass = "rounded-t-[20px] rounded-b-[6px]";
                          } else if (index === segments.length - 1) {
                            roundClass = "rounded-b-[20px] rounded-t-[6px]";
                          } else {
                            roundClass = "rounded-[6px]";
                          }

                          return (
                            <SequenceItem
                              key={segment.id}
                              id={segment.id}
                              className={roundClass}
                              fileName={
                                files.find((f) => f.id === segment.fileId)?.file
                                  .name || "File Loading"
                              }
                              range={segment.range}
                              onRangeChange={(val) =>
                                handleSegmentRangeChange(segment.id, val)
                              }
                              onRemove={() => handleRemoveSegment(segment.id)}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                  {segments.length === 0 && (
                    <div className="p-4 text-center text-xs text-text-muted border border-dashed border-border-subtle rounded-interactive bg-bg-surface-variant/20">
                      Import files above, then tap to add blocks to sequence.
                    </div>
                  )}
                </div>
                
                <Button
                  variant="primary"
                  onClick={executeMerge}
                  disabled={virtualPages.length === 0 || isProcessing}
                  className="w-full mt-auto shrink-0 h-11 text-xs"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Export Merged PDF"
                  )}
                </Button>
              </div>
            )}

            {activeTool === "rotate" && (
              <div className="flex flex-col gap-3.5 h-full">
                <div>
                  <label className="text-xs font-semibold text-text-secondary pl-1 block mb-2">
                    Degrees
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([90, 180, 270] as const).map((deg) => (
                      <button
                        key={deg}
                        onClick={() => setRotationDegrees(deg)}
                        className={`h-9 text-xs font-mono rounded-interactive border ${
                          rotationDegrees === deg
                            ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                            : "border-border-subtle/20 bg-bg-surface-variant hover:bg-bg-surface-variant/80 text-text-primary"
                        }`}
                      >
                        +{deg}°
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Applies {rotationDegrees}° rotation to all pages in your primary source document (first document uploaded).
                </p>
                <Button
                  variant="primary"
                  onClick={executeRotate}
                  disabled={files.length === 0 || isProcessing}
                  className="w-full mt-auto h-11 text-xs shrink-0"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <RotateCw className="w-4 h-4 stroke-[1.5px]" />
                      Rotate PDF
                    </span>
                  )}
                </Button>
              </div>
            )}

            {activeTool === "split" && (
              <div className="flex flex-col gap-3.5 h-full">
                <div>
                  <label className="text-xs font-semibold text-text-secondary pl-1 block mb-2">
                    Pages to Extract
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1-3, 5, 8-10"
                    value={splitPageRange}
                    onChange={(e) => setSplitPageRange(e.target.value)}
                    className="w-full h-11 px-4 bg-bg-surface-variant placeholder:text-text-muted/65 border border-transparent rounded-pill text-xs focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
                  />
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Select pages to pull from your primary document (e.g. &quot;1-5&quot; to save only the first five pages).
                </p>
                <Button
                  variant="primary"
                  onClick={executeSplit}
                  disabled={files.length === 0 || !splitPageRange || isProcessing}
                  className="w-full mt-auto h-11 text-xs shrink-0"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Extract Pages"
                  )}
                </Button>
              </div>
            )}

            {activeTool === "numbers" && (
              <div className="flex flex-col gap-3.5 h-full">
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Inserts clean, standard page number stamps (e.g., &quot;Page 1 of 5&quot;) at the bottom center footer of every page in your primary document.
                </p>
                <Button
                  variant="primary"
                  onClick={executeAddPageNumbers}
                  disabled={files.length === 0 || isProcessing}
                  className="w-full mt-auto h-11 text-xs shrink-0"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Add Page Numbers"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Preview Workspace Grid */}
      <section className="flex-1 bg-bg-surface p-4 rounded-container border border-border-subtle/10 shadow-soft_elevation flex flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle/10 mb-4 gap-4 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <span>Workspace Desk</span>
              {virtualPages.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-surface-variant font-bold text-text-secondary">
                  {virtualPages.length} {virtualPages.length === 1 ? "Page" : "Pages"}
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Free period label */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-pill bg-bg-surface-variant border border-border-subtle/10 text-[10px] text-text-secondary">
              <FileCheck className="w-3.5 h-3.5 text-accent-blue stroke-[1.5px]" />
              <span className="hidden sm:inline">Free Period Enabled</span>
            </div>
          </div>
        </div>

        {/* Content canvas */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {virtualPages.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndPageGrid}
            >
              <SortableContext
                items={virtualPages.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {virtualPages.map((page) => (
                    <PageItem
                      key={page.id}
                      id={page.id}
                      fileName={page.fileName}
                      pageNumber={page.pageIndex + 1}
                      thumbnailSrc={page.thumbnail}
                      onRemove={(id) => {
                        const parts = id.split("-");
                        const segmentId = parts[0];
                        const seg = segments.find((s) => s.id === segmentId);
                        if (!seg) return;

                        const file = files.find((f) => f.id === seg.fileId);
                        if (!file) return;

                        const indices = parsePageRange(seg.range, file.pageCount);
                        const filteredIndices = indices.filter(
                          (idx) => idx !== page.pageIndex
                        );

                        if (filteredIndices.length === 0) {
                          handleRemoveSegment(segmentId);
                        } else {
                          const newRange = filteredIndices
                            .map((idx) => idx + 1)
                            .join(", ");
                          handleSegmentRangeChange(segmentId, newRange);
                        }
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[350px] border-2 border-dashed border-border-subtle/20 rounded-container p-6 text-center bg-bg-surface-variant/10">
              <div className="h-14 w-14 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue mb-3">
                <FileUp className="w-6 h-6 stroke-[1.25px]" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1">
                Upload your files to begin
              </h3>
              <p className="text-[11px] text-text-secondary max-w-xs leading-relaxed mb-4">
                Drag and drop PDF files or images anywhere onto this workspace, or use the import button to load files.
              </p>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 px-5 text-xs"
              >
                Select Files
              </Button>
             </div>
           )}
         </div>
       </section>

      {/* Slide-over Plugin Request Drawer */}
      {showRequestDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-bg-surface h-full shadow-lg p-4 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-280 border-l border-border-subtle/10">
            <PluginRequestBoard onClose={() => setShowRequestDrawer(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

