import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generatePDF({ title, headers, rows, filename }) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(title || 'Report', 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  autoTable(doc, {
    startY: 38,
    head: [headers || []],
    body: rows || [],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(filename || 'report.pdf');
}
