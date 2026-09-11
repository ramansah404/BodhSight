import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';

/**
 * Export a dataset to Excel (.xlsx)
 * @param data Array of objects to export
 * @param filename Name of the file without extension
 * @param sheetName Name of the sheet (optional)
 */
export const exportToExcel = (data: any[], filename: string, sheetName = "Data") => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Auto-size columns (basic implementation)
  const colWidths = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 10) }));
  worksheet['!cols'] = colWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export a DOM element to a professional PDF
 * @param elementId ID of the DOM element to capture
 * @param filename Name of the file without extension
 * @param title Optional title to place at the top of the PDF
 */
export const exportToPDF = async (elementId: string, filename: string, title?: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    alert("Could not generate PDF. Content not found.");
    return;
  }

  try {
    // We add a tiny delay to ensure all re-renders/animations (like charts) are done
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: document.documentElement.classList.contains("dark") ? "#020817" : "#ffffff"
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    
    // Calculate aspect ratio
    const margin = 10;
    const availableWidth = pdfWidth - (margin * 2);
    const imgHeight = (imgProps.height * availableWidth) / imgProps.width;
    
    let currentY = margin;
    
    // Add title if provided
    if (title) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(title, margin, currentY + 5);
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, currentY + 12);
      
      currentY += 20;
    }
    
    // Add image
    if (currentY + imgHeight > pdfHeight) {
      // It's taller than one page, scale it down
      const scaleFactor = (pdfHeight - currentY - margin) / imgHeight;
      pdf.addImage(imgData, 'PNG', margin, currentY, availableWidth * scaleFactor, imgHeight * scaleFactor);
    } else {
      pdf.addImage(imgData, 'PNG', margin, currentY, availableWidth, imgHeight);
    }
    
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Failed to generate PDF. Please try again.");
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
