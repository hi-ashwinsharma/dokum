import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

export class PDFManager {
  // 1. MERGE PDFs: Combine multiple PDFs and Images into one
  static async mergePDFs(files: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();

      if (file.type === 'application/pdf') {
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      } else if (file.type.startsWith('image/')) {
        let image;
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await mergedPdf.embedJpg(arrayBuffer);
        } else if (file.type === 'image/png') {
          image = await mergedPdf.embedPng(arrayBuffer);
        }

        if (image) {
          const page = mergedPdf.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        }
      }
    }
    return await mergedPdf.save();
  }

  // 2. ASSEMBLE/ORGANIZE: Build a PDF page-by-page with caching
  static async assemblePDF(items: { file: File; pageIndex?: number }[]): Promise<Uint8Array> {
    const newPdf = await PDFDocument.create();
    const loadedPdfs = new Map<string, PDFDocument>();

    for (const item of items) {
      const arrayBuffer = await item.file.arrayBuffer();

      if (item.file.type === 'application/pdf') {
        if (item.pageIndex === undefined) continue;

        let pdf = loadedPdfs.get(item.file.name);
        if (!pdf) {
          pdf = await PDFDocument.load(arrayBuffer);
          loadedPdfs.set(item.file.name, pdf);
        }

        const [copiedPage] = await newPdf.copyPages(pdf, [item.pageIndex]);
        newPdf.addPage(copiedPage);
      } else if (item.file.type.startsWith('image/')) {
        let image;
        if (item.file.type === 'image/jpeg' || item.file.type === 'image/jpg') {
          image = await newPdf.embedJpg(arrayBuffer);
        } else if (item.file.type === 'image/png') {
          image = await newPdf.embedPng(arrayBuffer);
        }

        if (image) {
          const page = newPdf.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        }
      }
    }
    return await newPdf.save();
  }

  // 3. SPLIT PDF: Create a new PDF with specific pages
  static async splitPDF(file: File, pageIndices: number[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return await newPdf.save();
  }

  // 4. IMAGES TO PDF: Convert multiple photos to A4 PDF
  static async imagesToPDF(files: File[], options: { scale: 'fit' | 'fill' | 'original' } = { scale: 'fit' }): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const A4 = [595.28, 841.89] as [number, number];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      let image;
      
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        image = await pdfDoc.embedJpg(arrayBuffer);
      } else if (file.type === 'image/png') {
        image = await pdfDoc.embedPng(arrayBuffer);
      } else continue;

      let pageWidth, pageHeight, drawX, drawY, drawWidth, drawHeight;

      if (options.scale === 'original') {
          pageWidth = image.width;
          pageHeight = image.height;
          drawX = 0; drawY = 0; drawWidth = image.width; drawHeight = image.height;
      } else {
          pageWidth = A4[0];
          pageHeight = A4[1];
          const imgRatio = image.width / image.height;
          const pageRatio = pageWidth / pageHeight;
          
          if (options.scale === 'fit') {
              if (imgRatio > pageRatio) {
                  drawWidth = pageWidth;
                  drawHeight = pageWidth / imgRatio;
              } else {
                  drawHeight = pageHeight;
                  drawWidth = pageHeight * imgRatio;
              }
          } else { 
               if (imgRatio > pageRatio) {
                  drawHeight = pageHeight;
                  drawWidth = pageHeight * imgRatio;
               } else {
                  drawWidth = pageWidth;
                  drawHeight = pageWidth / imgRatio;
               }
          }
          drawX = (pageWidth - drawWidth) / 2;
          drawY = (pageHeight - drawHeight) / 2;
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(image, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }
    return await pdfDoc.save();
  }

  // 5. ROTATE PDF: Rotate all pages by specific degrees (e.g., 90)
  static async rotatePDF(file: File, rotationAngle: number): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotationAngle) % 360));
    });

    return await pdfDoc.save();
  }

  // 6. ADD PAGE NUMBERS: Footer numbers (e.g., "Page 1 of 5")
  static async addPageNumbers(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    pages.forEach((page, index) => {
      const { width } = page.getSize();
      const text = `Page ${index + 1} of ${pages.length}`;
      page.drawText(text, {
        x: width / 2 - 30, // Approximate centering
        y: 20,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
    });

    return await pdfDoc.save();
  }

  // 7. DELETE PAGES: Remove specific pages safely
  static async deletePages(file: File, pagesToDelete: number[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Reverse order delete ensures indices don't shift during processing
    const sortedIndices = [...pagesToDelete].sort((a, b) => b - a);
    sortedIndices.forEach((index) => {
        pdfDoc.removePage(index);
    });

    return await pdfDoc.save();
  }
}
