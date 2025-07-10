declare module 'html2pdf.js' {
  function html2pdf(): Html2PdfWrapper;
  
  interface Html2PdfWrapper {
    from(element: HTMLElement | DocumentFragment | string): Html2PdfWrapper;
    set(options: Html2PdfOptions): Html2PdfWrapper;
    save(): Promise<void>;
    toPdf(): any;
    output(type: string, options?: any): any;
  }
  
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      letterRendering?: boolean;
      [key: string]: any;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: 'portrait' | 'landscape';
      [key: string]: any;
    };
    [key: string]: any;
  }
  
  export default html2pdf;
}