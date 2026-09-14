import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';

/**
 * Export a dataset to Excel (.xlsx)
 * @param data Array of objects to export
 * @param filename Name of the file without extension
 * @param sheetName Name of the sheet (optional)
 */
export const exportToExcel = (data: any[] | Record<string, any[]>, filename: string, defaultSheetName = "Data") => {
  if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
    alert("No data available to export.");
    return;
  }
  
  const workbook = XLSX.utils.book_new();

  if (Array.isArray(data)) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 10) }));
    worksheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, worksheet, defaultSheetName);
  } else {
    for (const [sheetName, sheetData] of Object.entries(data)) {
      if (sheetData && sheetData.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        const colWidths = Object.keys(sheetData[0] || {}).map(key => ({ wch: Math.max(key.length, 10) }));
        worksheet['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // Max sheet name length
      }
    }
  }
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

import autoTable from 'jspdf-autotable';

/**
 * Export structured data to a professional PDF document
 * @param title Document title
 * @param paragraphs Array of text paragraphs
 * @param tableData Optional 2D array of strings for a data table [[Header1, Header2], [Val1, Val2]]
 * @param filename Name of the file without extension
 */
export const exportToPDF = (title: string, paragraphs: string[], tableData: string[][] | null, filename: string) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let currentY = 15;
    const margin = 14;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // 1. Add Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42); // slate-900
    
    // Split title if it's too long
    const splitTitle = pdf.splitTextToSize(title, pageWidth - (margin * 2));
    pdf.text(splitTitle, margin, currentY);
    currentY += (splitTitle.length * 7) + 5;

    // 2. Add Meta information (date generated)
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, currentY);
    currentY += 10;

    // 3. Add Paragraphs
    pdf.setFontSize(11);
    pdf.setTextColor(51, 65, 85); // slate-700
    
    paragraphs.forEach(p => {
      if (!p.trim()) return;
      const splitText = pdf.splitTextToSize(p, pageWidth - (margin * 2));
      pdf.text(splitText, margin, currentY);
      currentY += (splitText.length * 5) + 3;
    });

    currentY += 5; // Extra padding before table

    // 4. Add Table if provided
    if (tableData && tableData.length > 0) {
      // First row is assumed to be headers
      const headers = tableData[0];
      const body = tableData.slice(1);

      autoTable(pdf, {
        startY: currentY,
        head: [headers],
        body: body,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 4,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240], // slate-200
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [248, 250, 252], // slate-50
          textColor: [15, 23, 42], // slate-900
          fontStyle: 'bold',
          lineColor: [203, 213, 225], // slate-300
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        margin: { left: margin, right: margin }
      });
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Failed to generate PDF document. Please try again.");
  }
};

/**
 * Export data to a structured Word document (.docx)
 * @param title Document title
 * @param paragraphs Array of text paragraphs
 * @param tableData Optional 2D array of strings for a data table [[Header1, Header2], [Val1, Val2]]
 * @param filename Name of the file without extension
 */
export const exportToWord = async (title: string, paragraphs: string[], tableData: string[][] | null, filename: string) => {
  try {
    const docChildren: any[] = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 }
      }),
      new Paragraph({
        text: `Generated on: ${new Date().toLocaleDateString()}`,
        spacing: { after: 400 }
      })
    ];

    paragraphs.forEach(p => {
      docChildren.push(
        new Paragraph({
          children: [new TextRun(p)],
          spacing: { after: 200 }
        })
      );
    });

    if (tableData && tableData.length > 0) {
      const tableRows = tableData.map((row) => {
        return new TableRow({
          children: row.map(cellText => {
            return new TableCell({
              children: [new Paragraph({ 
                text: String(cellText),
                // Simple workaround for bolding header
              })],
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            });
          })
        });
      });

      docChildren.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
            insideVertical: { style: BorderStyle.SINGLE, size: 1 },
          }
        })
      );
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren
      }]
    });

    const blob = await Packer.toBlob(doc);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Word generation failed:", error);
    alert("Failed to generate Word document. Please try again.");
  }
};
