import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

// Define options interface to provide type safety
interface ExportOptions {
  orientation?: 'portrait' | 'landscape';
  format?: string;
  pagebreak?: {
    mode?: string[];
    before?: string[];
    after?: string[];
    avoid?: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class DocumentExportService {

  constructor() { }

  /**
   * Export HTML content to PDF with proper text selection support
   * @param elementId The ID of the element to export
   * @param filename The name of the file to export
   * @param options Optional PDF export options
   */
  exportToPdf(elementId: string, filename: string, options?: ExportOptions): void {
    const element = document.getElementById(elementId);
    
    if (!element) {
      console.error(`Element with ID ${elementId} not found`);
      return;
    }

    // Default pagebreak settings to avoid table splitting
    const defaultPagebreak = {
      mode: ['avoid-all'],
      avoid: ['.table-container', 'table', '.matrix-table', '.livrable-totals-table', 
              '.phase-totals-table', '.profile-totals-table', '.entity-totals-table',
              '.chart-section']
    };

    // Set default options and merge with provided options
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: options?.format || 'a4', 
        orientation: options?.orientation || 'portrait' as 'portrait' | 'landscape'
      },
      // Merge provided pagebreak settings with defaults or use defaults if none provided
      pagebreak: options?.pagebreak || defaultPagebreak
    };

    console.log(`Exporting PDF with orientation: ${opt.jsPDF.orientation} and table handling settings`);

    // Use html2pdf which properly handles text selection
    html2pdf().from(element).set(opt).save();
  }
}
