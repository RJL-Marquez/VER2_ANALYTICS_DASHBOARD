import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { SurveyType } from '../types/survey';
import { CompanyComposite } from './scoring';

/** What graph sections the person chose to include, plus the captured chart images (if any). */
export interface CompanyReportGraphSelection {
  bar: boolean;
  radar: boolean;
  trend: boolean;
  perQuestion: boolean;
}

export interface CompanyReportQuestionRow {
  question: string;
  average: number;
  responses: number;
}

export interface CompanyReportChartImages {
  bar?: string | null; // PNG data URL
  radar?: string | null;
  trend?: string | null;
}

export interface CompanyReportData {
  company: string;
  surveyType: SurveyType;
  composite: CompanyComposite;
  generatedOn: string;
  graphs: CompanyReportGraphSelection;
  includeComments: boolean;
  questionRows: CompanyReportQuestionRow[];
  chartImages: CompanyReportChartImages;
}

const BRAND = [0, 99, 169] as const;

/** Renders one DOM node (a chart wrapper) to a PNG data URL for embedding in PDF/DOCX exports. */
export async function captureChartImage(node: HTMLElement | null): Promise<string | null> {
  if (!node) return null;
  try {
    const canvas = await html2canvas(node, { backgroundColor: '#ffffff', scale: 2, logging: false });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function dataUrlDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 600, height: img.naturalHeight || 300 });
    img.onerror = () => resolve({ width: 600, height: 300 });
    img.src = dataUrl;
  });
}

/* ------------------------------------------------------------------ */
/* PDF export                                                          */
/* ------------------------------------------------------------------ */

export async function exportCompanyReportAsPDF(data: CompanyReportData) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginLeft = 40;
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - marginLeft * 2;
  let cursorY = 56;

  const ensureSpace = (needed: number) => {
    if (cursorY + needed > doc.internal.pageSize.height - 50) {
      doc.addPage();
      cursorY = 56;
    }
  };

  // Title block
  doc.setFontSize(20);
  doc.setTextColor(...BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text('Company Performance Report', marginLeft, cursorY);
  cursorY += 24;

  doc.setFontSize(15);
  doc.setTextColor(20, 20, 20);
  doc.text(data.company, marginLeft, cursorY);
  cursorY += 18;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`${data.surveyType} · Generated ${data.generatedOn}`, marginLeft, cursorY);
  cursorY += 26;

  // Score summary strip
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginLeft, cursorY, contentWidth, 56, 6, 6, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('COMPOSITE SCORE', marginLeft + 14, cursorY + 20);
  doc.text('RATING BAND', marginLeft + 190, cursorY + 20);
  doc.text('EVALUATIONS', marginLeft + 340, cursorY + 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND);
  doc.text(`${data.composite.compositeScore.toFixed(1)} / 100`, marginLeft + 14, cursorY + 40);
  doc.setTextColor(20, 20, 20);
  doc.text(data.composite.band.label, marginLeft + 190, cursorY + 40);
  doc.text(String(data.composite.evaluationCount), marginLeft + 340, cursorY + 40);
  doc.setFont('helvetica', 'normal');
  cursorY += 80;

  const addImageSection = async (title: string, dataUrl: string | null | undefined) => {
    if (!dataUrl) return;
    const { width, height } = await dataUrlDimensions(dataUrl);
    const drawWidth = contentWidth;
    const drawHeight = (height / width) * drawWidth;
    ensureSpace(drawHeight + 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(title, marginLeft, cursorY);
    cursorY += 14;
    doc.addImage(dataUrl, 'PNG', marginLeft, cursorY, drawWidth, drawHeight);
    cursorY += drawHeight + 24;
  };

  if (data.graphs.bar) await addImageSection('Section Scores — Bar Graph', data.chartImages.bar);
  if (data.graphs.radar) await addImageSection('Section Scores — Radar Graph', data.chartImages.radar);
  if (data.graphs.trend) await addImageSection('Score Trend', data.chartImages.trend);

  if (data.graphs.perQuestion) {
    ensureSpace(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('Per-Question Average Rating', marginLeft, cursorY);
    cursorY += 10;
    autoTable(doc, {
      startY: cursorY,
      head: [['Question', 'Average Rating', 'Responses']],
      body: data.questionRows.map((row) => [row.question, `${row.average.toFixed(1)}`, String(row.responses)]),
      margin: { left: marginLeft, right: marginLeft },
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: BRAND as unknown as [number, number, number], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'striped',
    });
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26;
  }

  if (data.includeComments) {
    ensureSpace(70);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('Stakeholder Comments', marginLeft, cursorY);
    cursorY += 18;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120);
    doc.text('No comments have been submitted yet — free-text feedback is not yet collected on this questionnaire.', marginLeft, cursorY, {
      maxWidth: contentWidth,
    });
    cursorY += 30;
  }

  // Footer on every page
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount} — Microgenesis Supplier Management System`, marginLeft, doc.internal.pageSize.height - 20);
  }

  const filenameSafe = data.company.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  doc.save(`company_report_${filenameSafe}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/* ------------------------------------------------------------------ */
/* DOCX export                                                         */
/* ------------------------------------------------------------------ */

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function imageParagraph(dataUrl: string | null | undefined, title: string): Promise<Paragraph[]> {
  if (!dataUrl) return [];
  const { width, height } = await dataUrlDimensions(dataUrl);
  const maxWidth = 560;
  const drawWidth = Math.min(maxWidth, width);
  const drawHeight = (height / width) * drawWidth;

  return [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          type: 'png',
          data: dataUrlToUint8Array(dataUrl),
          transformation: { width: drawWidth, height: drawHeight },
        }),
      ],
    }),
  ];
}

export async function exportCompanyReportAsDocx(data: CompanyReportData) {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({ text: 'Company Performance Report', heading: HeadingLevel.TITLE, spacing: { after: 120 } }),
    new Paragraph({ text: data.company, heading: HeadingLevel.HEADING_1, spacing: { after: 80 } }),
    new Paragraph({
      children: [
        new TextRun({ text: `${data.surveyType} · Generated ${data.generatedOn}`, color: '64748B', size: 20 }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Composite Score: ', bold: true }),
        new TextRun({ text: `${data.composite.compositeScore.toFixed(1)} / 100    ` }),
        new TextRun({ text: 'Rating Band: ', bold: true }),
        new TextRun({ text: `${data.composite.band.label}    ` }),
        new TextRun({ text: 'Evaluations: ', bold: true }),
        new TextRun({ text: String(data.composite.evaluationCount) }),
      ],
      spacing: { after: 200 },
    }),
  );

  if (data.graphs.bar) children.push(...(await imageParagraph(data.chartImages.bar, 'Section Scores — Bar Graph')));
  if (data.graphs.radar) children.push(...(await imageParagraph(data.chartImages.radar, 'Section Scores — Radar Graph')));
  if (data.graphs.trend) children.push(...(await imageParagraph(data.chartImages.trend, 'Score Trend')));

  const bodyBlocks: (Paragraph | Table)[] = [...children];

  if (data.graphs.perQuestion) {
    bodyBlocks.push(new Paragraph({ text: 'Per-Question Average Rating', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }));
    const headerRow = new TableRow({
      tableHeader: true,
      children: ['Question', 'Average Rating', 'Responses'].map(
        (label) =>
          new TableCell({
            shading: { fill: '0063A9' },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: 'FFFFFF' })] })],
          }),
      ),
    });
    const rows = data.questionRows.map(
      (row, idx) =>
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
              children: [new Paragraph(row.question)],
            }),
            new TableCell({
              shading: { fill: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
              children: [new Paragraph(row.average.toFixed(1))],
            }),
            new TableCell({
              shading: { fill: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
              children: [new Paragraph(String(row.responses))],
            }),
          ],
        }),
    );
    bodyBlocks.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...rows],
      }),
    );
  }

  if (data.includeComments) {
    bodyBlocks.push(
      new Paragraph({ text: 'Stakeholder Comments', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'No comments have been submitted yet — free-text feedback is not yet collected on this questionnaire.',
            italics: true,
            color: '64748B',
          }),
        ],
      }),
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children: bodyBlocks }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filenameSafe = data.company.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  link.href = url;
  link.download = `company_report_${filenameSafe}_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
