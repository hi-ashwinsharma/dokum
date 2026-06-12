import type { PDFDocumentProxy } from 'pdfjs-dist';
import type * as pdfjs from 'pdfjs-dist';

let pdfjsLib: typeof pdfjs | null = null;

const getPdfJs = async () => {
  if (pdfjsLib) return pdfjsLib;

  // Dynamic import ensures this only runs client-side when rendering is triggered
  const lib = await import('pdfjs-dist');
  
  if (typeof window !== 'undefined' && !lib.GlobalWorkerOptions.workerSrc) {
    lib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
  }
  
  pdfjsLib = lib;
  return lib;
};

export class PDFRenderer {
  static async loadDocument(file: File): Promise<PDFDocumentProxy> {
    const lib = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = lib.getDocument({ data: arrayBuffer });
    return await loadingTask.promise;
  }

  static async renderPage(
    pdfDoc: PDFDocumentProxy,
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.0
  ): Promise<void> {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: canvas.getContext('2d')!,
      viewport: viewport,
    };

    await page.render(renderContext as Parameters<typeof page.render>[0]).promise;
  }

  static async renderThumbnail(file: File, pageNumber: number, scale: number = 0.5): Promise<string> {
    const pdf = await this.loadDocument(file);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: canvas.getContext('2d')!,
      viewport: viewport,
    };

    await page.render(renderContext as Parameters<typeof page.render>[0]).promise;
    return canvas.toDataURL();
  }
}
