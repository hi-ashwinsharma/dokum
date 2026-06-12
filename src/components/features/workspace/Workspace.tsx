"use client";

import React, { useState, useRef, useMemo } from "react";
import { PDFManager } from "@/services/pdf/pdfManager";
import { PDFRenderer } from "@/services/pdf/pdfRenderer";
import { PDFDocument } from 'pdf-lib';
import { PageItem } from "./PageItem";
import { SourceFileList } from "./SourceFileList";
import { SequenceItem } from "./SequenceItem";
import { parsePageRange } from "@/lib/pageParser";
import { Button } from "@/components/ui/Button";
import { 
  FileUp, 
  RefreshCw, 
  RotateCw, 
  FileCheck
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

export default function Workspace() {
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [segments, setSegments] = useState<MergeSegment[]>([]);
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map()); // Key: `${fileId}-${pageIndex}`
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<"merge" | "rotate" | "split" | "numbers">("merge");
  
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
      // Re-order segments to match page grid order if possible.
      // DND re-ordering a flattened grid with multiple segments is best represented
      // by converting the current flattened order into a new sequence of page segments.
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
      // Rotate the first file in source files list
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
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)] gap-6 p-6">
      {/* Split Sidebar Wrapper */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6 h-full relative">
        {/* Card 1: Documents & Uploads */}
        <div className="bg-bg-surface p-6 rounded-container border border-border-subtle/10 shadow-soft_elevation flex flex-col gap-4 max-h-[40vh] relative pt-8">
          {/* Floating limited period badge */}
          <div className="absolute -top-3 left-6 px-3 py-1 bg-accent-blue/15 text-accent-blue rounded-full text-[10px] font-bold font-mono border border-accent-blue/20">
            FREE PERIOD ACTIVE
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary pl-1">
              Import Documents
            </h3>
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
              className="w-full h-14 border border-dashed border-border-subtle bg-bg-surface-variant/40 hover:bg-bg-surface-variant text-text-primary rounded-pill font-medium flex items-center justify-center gap-2.5 transition-all duration-280"
            >
              <FileUp className="w-5 h-5 text-accent-blue stroke-[1.5px]" />
              <span className="text-sm">Upload Files</span>
            </button>
          </div>

          {/* Source Files list (scrollable so it never causes page-level overflow) */}
          {files.length > 0 && (
            <div className="flex flex-col gap-2 flex-1 overflow-hidden">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary pl-1">
                Source Files
              </h3>
              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                <SourceFileList
                  files={files}
                  onRemove={handleRemoveFile}
                  onAddSegment={handleAddSegment}
                />
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Tool Configuration & Actions */}
        <div className="bg-bg-surface p-6 rounded-container border border-border-subtle/10 shadow-soft_elevation flex flex-col gap-4 flex-1 min-h-[350px] overflow-hidden">
          {/* Action Panel based on mode */}
          <div className="pt-2 flex-1 flex flex-col min-h-0 overflow-y-auto">
            {activeTool === "merge" && (
              <div className="flex flex-col flex-1 gap-4 min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
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
                      <div className="flex flex-col gap-2">
                        {segments.map((segment) => (
                          <SequenceItem
                            key={segment.id}
                            id={segment.id}
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
                        ))}
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
                  className="w-full mt-auto shrink-0"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    "Export Merged PDF"
                  )}
                </Button>
              </div>
            )}

            {activeTool === "rotate" && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary pl-1 block mb-2">
                    Degrees
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([90, 180, 270] as const).map((deg) => (
                      <button
                        key={deg}
                        onClick={() => setRotationDegrees(deg)}
                        className={`h-10 text-xs font-mono rounded-interactive border ${
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
                  className="w-full mt-auto"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
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
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary pl-1 block mb-2">
                    Pages to Extract
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1-3, 5, 8-10"
                    value={splitPageRange}
                    onChange={(e) => setSplitPageRange(e.target.value)}
                    className="w-full h-12 px-4 bg-bg-surface-variant placeholder:text-text-muted/65 border border-transparent rounded-pill text-xs focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
                  />
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Select pages to pull from your primary document (e.g. &quot;1-5&quot; to save only the first five pages).
                </p>
                <Button
                  variant="primary"
                  onClick={executeSplit}
                  disabled={files.length === 0 || !splitPageRange || isProcessing}
                  className="w-full mt-auto"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    "Extract Pages"
                  )}
                </Button>
              </div>
            )}

            {activeTool === "numbers" && (
              <div className="flex flex-col gap-4">
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Inserts clean, standard page number stamps (e.g., &quot;Page 1 of 5&quot;) at the bottom center footer of every page in your primary document.
                </p>
                <Button
                  variant="primary"
                  onClick={executeAddPageNumbers}
                  disabled={files.length === 0 || isProcessing}
                  className="w-full mt-auto"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
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
      <section className="flex-1 bg-bg-surface p-6 rounded-container border border-border-subtle/10 shadow-soft_elevation flex flex-col min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border-subtle/10 mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span>Workspace Desk</span>
              {virtualPages.length > 0 && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-surface-variant font-bold text-text-secondary">
                  {virtualPages.length} {virtualPages.length === 1 ? "Page" : "Pages"}
                </span>
              )}
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Drag and drop layout blocks to reorganize your final document. Processing is 100% offline.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Contextual Command Bar (shows only when files are imported) */}
            {files.length > 0 && (
              <div className="flex items-center bg-bg-surface-variant/60 p-1 rounded-pill border border-border-subtle/10">
                {(
                  [
                    { id: "merge", label: "Merge" },
                    { id: "rotate", label: "Rotate" },
                    { id: "split", label: "Extract" },
                    { id: "numbers", label: "Page Numbers" },
                  ] as const
                ).map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`h-8 px-4 rounded-pill text-[11px] font-bold transition-all duration-280 ${
                      activeTool === tool.id
                        ? "bg-bg-surface text-accent-blue shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            )}

            {/* Free period label */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-bg-surface-variant border border-border-subtle/10 text-xs text-text-secondary">
              <FileCheck className="w-4 h-4 text-accent-blue stroke-[1.5px]" />
              <span>Free Period Enabled</span>
            </div>
          </div>
        </div>

        {/* Content canvas */}
        <div className="flex-1 overflow-y-auto">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {virtualPages.map((page) => (
                    <PageItem
                      key={page.id}
                      id={page.id}
                      fileName={page.fileName}
                      pageNumber={page.pageIndex + 1}
                      thumbnailSrc={page.thumbnail}
                      onRemove={(id) => {
                        // Find the segment representing this page
                        const parts = id.split("-");
                        const segmentId = parts[0];
                        const seg = segments.find((s) => s.id === segmentId);
                        if (!seg) return;

                        const file = files.find((f) => f.id === seg.fileId);
                        if (!file) return;

                        // Parse the range, remove this page, and reformat back to range string
                        const indices = parsePageRange(seg.range, file.pageCount);
                        const filteredIndices = indices.filter(
                          (idx) => idx !== page.pageIndex
                        );

                        if (filteredIndices.length === 0) {
                          handleRemoveSegment(segmentId);
                        } else {
                          // Simple comma separated representation
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
            <div className="flex flex-col items-center justify-center h-full min-h-[350px] border-2 border-dashed border-border-subtle/20 rounded-container p-8 text-center bg-bg-surface-variant/10">
              <div className="h-16 w-16 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue mb-4">
                <FileUp className="w-8 h-8 stroke-[1.25px]" />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-1">
                Upload your files to begin
              </h3>
              <p className="text-xs text-text-secondary max-w-sm leading-relaxed mb-6">
                Drag and drop PDF files or images anywhere onto this workspace, or use the import button to load files.
              </p>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="h-12 px-6"
              >
                Select Files
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
