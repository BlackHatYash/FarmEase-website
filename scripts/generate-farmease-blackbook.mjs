import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
});

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 22;
const MARGIN_R = 22;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

// Draw outer frame and optional footer ("N | P a g e")
function decoratePage(pageNumberLabel = null) {
  // Single crisp outer border matching sample Black Book
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.45);
  doc.rect(11, 11, PAGE_W - 22, PAGE_H - 22);

  if (pageNumberLabel !== null) {
    // Bottom footer rule & right-aligned "N | P a g e"
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_L, PAGE_H - 20, PAGE_W - MARGIN_R, PAGE_H - 20);
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(20, 20, 20);
    doc.text(`${pageNumberLabel} | P a g e`, PAGE_W - MARGIN_R, PAGE_H - 14.5, { align: 'right' });
  }
}

function nextPage(pageNumberLabel = null) {
  doc.addPage();
  decoratePage(pageNumberLabel);
}

function sanitizePdfText(str) {
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/\u2192/g, '->')
    .replace(/\u20B9/g, 'Rs.')
    .replace(/\u00B0/g, ' deg ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
}

function drawBulletShape(symbol, x, y) {
  doc.setDrawColor(20, 20, 20);
  doc.setFillColor(20, 20, 20);
  doc.setLineWidth(0.35);
  if (symbol === '✓') {
    doc.setDrawColor(6, 95, 70);
    doc.setLineWidth(0.5);
    doc.line(x + 0.3, y - 1.2, x + 1.4, y - 0.1);
    doc.line(x + 1.4, y - 0.1, x + 3.4, y - 3.0);
    return true;
  }
  if (symbol === '❖') {
    const cx = x + 1.6;
    const cy = y - 1.3;
    doc.circle(cx, cy - 1.0, 0.45, 'F');
    doc.circle(cx, cy + 1.0, 0.45, 'F');
    doc.circle(cx - 1.0, cy, 0.45, 'F');
    doc.circle(cx + 1.0, cy, 0.45, 'F');
    return true;
  }
  if (symbol === '➢') {
    doc.triangle(x + 0.4, y - 2.6, x + 3.2, y - 1.3, x + 0.4, y, 'F');
    return true;
  }
  if (symbol === '□') {
    doc.rect(x + 0.4, y - 2.6, 2.4, 2.4);
    return true;
  }
  if (symbol === 'o') {
    doc.circle(x + 1.5, y - 1.3, 1.0);
    return true;
  }
  return false;
}

function writeParagraph(text, x, y, width, lineHeight = 5.6, indent = 0, fontStyle = 'normal', fontSize = 11) {
  doc.setFont('times', fontStyle);
  doc.setFontSize(fontSize);
  doc.setTextColor(15, 15, 15);
  const cleanText = sanitizePdfText(text);
  const full = indent > 0 ? `${' '.repeat(indent)}${cleanText}` : cleanText;
  const lines = doc.splitTextToSize(full, width);
  lines.forEach((line) => {
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y + 2.5;
}

function writeBullet(symbol, boldLabel, body, x, y, width, lineHeight = 5.4, fontSize = 11) {
  doc.setFontSize(fontSize);
  doc.setTextColor(15, 15, 15);
  const drawn = drawBulletShape(symbol, x, y);
  if (!drawn && symbol) {
    doc.setFont('times', 'bold');
    doc.text(sanitizePdfText(symbol), x, y);
  }
  const textX = x + 6;
  const availW = width - 6;
  const cleanLabel = sanitizePdfText(boldLabel || '');
  const cleanBody = sanitizePdfText(body || '');
  if (cleanLabel) {
    const combined = `${cleanLabel}: ${cleanBody}`;
    const lines = doc.splitTextToSize(combined, availW);
    lines.forEach((line, idx) => {
      if (idx === 0 && line.startsWith(`${cleanLabel}:`)) {
        doc.setFont('times', 'bold');
        const labelPart = `${cleanLabel}:`;
        doc.text(labelPart, textX, y);
        const lw = doc.getTextWidth(labelPart) + 1.5;
        doc.setFont('times', 'normal');
        doc.text(line.slice(labelPart.length).trimStart(), textX + lw, y);
      } else {
        doc.setFont('times', 'normal');
        doc.text(line, textX, y);
      }
      y += lineHeight;
    });
  } else {
    doc.setFont('times', 'normal');
    const lines = doc.splitTextToSize(cleanBody, availW);
    lines.forEach((line) => {
      doc.text(line, textX, y);
      y += lineHeight;
    });
  }
  return y + 2;
}

function drawChapterHeader(chapterNum, title, yStart = 28) {
  doc.setFont('times', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(10, 10, 10);
  doc.text(`CHAPTER ${chapterNum}`, PAGE_W / 2, yStart, { align: 'center' });
  doc.setFontSize(17);
  doc.text(title.toUpperCase(), PAGE_W / 2, yStart + 9, { align: 'center' });
  return yStart + 22;
}

function drawSectionHeading(title, x, y, size = 14) {
  doc.setFont('times', 'bold');
  doc.setFontSize(size);
  doc.setTextColor(10, 10, 10);
  doc.text(title, x, y);
  return y + 8;
}

function drawSubHeading(title, x, y, size = 12) {
  doc.setFont('times', 'bold');
  doc.setFontSize(size);
  doc.setTextColor(20, 20, 20);
  doc.text(title, x, y);
  return y + 6.5;
}

function drawStyledTable(headers, rows, colWidths, x, y, headerFill = [225, 232, 240], fontSize = 9.5) {
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.3);

  // Header
  doc.setFont('times', 'bold');
  doc.setFontSize(fontSize);
  let maxHL = 1;
  const hLines = headers.map((h, i) => {
    const l = doc.splitTextToSize(h, colWidths[i] - 4);
    if (l.length > maxHL) maxHL = l.length;
    return l;
  });
  const hH = maxHL * 4.5 + 5;
  let cx = x;
  headers.forEach((_, i) => {
    doc.setFillColor(...headerFill);
    doc.rect(cx, y, colWidths[i], hH, 'FD');
    doc.setTextColor(15, 15, 15);
    hLines[i].forEach((line, li) => {
      doc.text(line, cx + colWidths[i] / 2, y + 5 + li * 4.5, { align: 'center' });
    });
    cx += colWidths[i];
  });
  y += hH;

  // Rows
  doc.setFont('times', 'normal');
  doc.setFontSize(fontSize - 0.3);
  rows.forEach((row, rIdx) => {
    let maxL = 1;
    const cLines = row.map((cell, i) => {
      const l = doc.splitTextToSize(sanitizePdfText(String(cell)), colWidths[i] - 4);
      if (l.length > maxL) maxL = l.length;
      return l;
    });
    const rH = Math.max(9, maxL * 4.3 + 4.5);
    cx = x;
    const isTotalRow = String(row[0]).toLowerCase() === 'total';
    row.forEach((_, i) => {
      if (isTotalRow) {
        doc.setFillColor(...headerFill);
        doc.rect(cx, y, colWidths[i], rH, 'FD');
        doc.setFont('times', 'bold');
      } else {
        doc.rect(cx, y, colWidths[i], rH);
        doc.setFont('times', i === 0 && row.length <= 4 ? 'normal' : 'normal');
      }
      doc.setTextColor(15, 15, 15);
      cLines[i].forEach((line, li) => {
        doc.text(line, cx + 2.5, y + 5 + li * 4.3);
      });
      cx += colWidths[i];
    });
    y += rH;
  });
  return y + 5;
}

function drawTocLine(label, pageStr, x, y, bold = false, indent = 0) {
  doc.setFont('times', bold ? 'bold' : 'normal');
  doc.setFontSize(bold ? 12 : 11);
  doc.setTextColor(15, 15, 15);
  const startX = x + indent;
  doc.text(label, startX, y);
  const labelW = doc.getTextWidth(label);
  const pageW = doc.getTextWidth(pageStr);
  const rightX = PAGE_W - MARGIN_R;
  doc.text(pageStr, rightX, y, { align: 'right' });

  // Dot leaders
  const dotStart = startX + labelW + 2;
  const dotEnd = rightX - pageW - 2;
  doc.setFont('times', 'normal');
  let dx = dotStart;
  while (dx < dotEnd) {
    doc.text('.', dx, y);
    dx += 1.6;
  }
  return y + (bold ? 8 : 6.8);
}

// Helper for UML boxes
function drawBox(x, y, w, h, title, attrs = [], methods = [], fillRgb = [254, 250, 224]) {
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.setFillColor(...fillRgb);
  doc.rect(x, y, w, h, 'FD');
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 15, 15);
  doc.text(title, x + w / 2, y + 4.5, { align: 'center' });
  let cy = y + 6.5;
  doc.line(x, cy, x + w, cy);
  cy += 3.5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.4);
  attrs.forEach((a) => {
    if (cy < y + h - 2) {
      doc.text(a.slice(0, 38), x + 1.5, cy);
      cy += 3;
    }
  });
  if (methods.length > 0 && cy < y + h - 4) {
    doc.line(x, cy - 1.5, x + w, cy - 1.5);
    cy += 2;
    methods.forEach((m) => {
      if (cy < y + h - 1.5) {
        doc.text(m.slice(0, 38), x + 1.5, cy);
        cy += 3;
      }
    });
  }
}

function drawArrow(x1, y1, x2, y2, dashed = false) {
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.3);
  if (dashed) doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(x1, y1, x2, y2);
  doc.setLineDashPattern([], 0);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 2.2;
  doc.line(x2, y2, x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  doc.line(x2, y2, x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
}

function drawStickActor(cx, cy, label, fillRgb) {
  doc.setDrawColor(40, 40, 40);
  doc.setFillColor(...fillRgb);
  doc.circle(cx, cy - 7, 3.2, 'FD');
  doc.line(cx, cy - 3.8, cx, cy + 4);
  doc.line(cx - 5, cy - 1, cx + 5, cy - 1);
  doc.line(cx, cy + 4, cx - 4, cy + 10);
  doc.line(cx, cy + 4, cx + 4, cy + 10);
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 15, 15);
  doc.text(label, cx, cy + 14.5, { align: 'center' });
}

// =========================================================================
// PAGE 1: TITLE PAGE (Unnumbered)
// =========================================================================
decoratePage(null);

// Subtle background emblem watermark (matching sample page 1 style)
doc.setFillColor(232, 245, 236);
doc.circle(PAGE_W / 2, 138, 42, 'F');
doc.setFillColor(220, 238, 226);
doc.triangle(76, 175, 105, 92, 134, 175, 'F');

doc.setFont('times', 'normal');
doc.setFontSize(14);
doc.setTextColor(15, 15, 15);
doc.text('___________________________________________________', PAGE_W / 2, 32, { align: 'center' });
doc.setFontSize(10);
doc.setTextColor(90, 90, 90);
doc.text('(College Name & Location)', PAGE_W / 2, 37.5, { align: 'center' });

doc.setFont('times', 'normal');
doc.setFontSize(19);
doc.setTextColor(10, 10, 10);
doc.text('Department of Computer Science / Information Technology', PAGE_W / 2, 58, { align: 'center' });

doc.setFontSize(15.5);
doc.text('A PROJECT REPORT', PAGE_W / 2, 86, { align: 'center' });
doc.setFontSize(13.5);
doc.text('on', PAGE_W / 2, 100, { align: 'center' });
doc.setFont('times', 'italic');
doc.setFontSize(15.5);
doc.text('FarmEase – AI Digital Farming Assistant', PAGE_W / 2, 109, { align: 'center' });

doc.setFont('times', 'normal');
doc.setFontSize(13.5);
doc.text('Submitted by', PAGE_W / 2, 128, { align: 'center' });
doc.setFont('times', 'italic');
doc.setFontSize(14.5);
doc.text('Yash Shidruk', PAGE_W / 2, 142, { align: 'center' });

doc.setFont('times', 'normal');
doc.setFontSize(13.5);
doc.text('in partial fulfillment for the award of the degree of', PAGE_W / 2, 160, { align: 'center' });
doc.setFont('times', 'normal');
doc.setFontSize(14.5);
doc.text('BACHELOR OF SCIENCE - COMPUTER SCIENCE / IT', PAGE_W / 2, 178, { align: 'center' });
doc.text('(Semester V / VI)', PAGE_W / 2, 186, { align: 'center' });

doc.setFontSize(13.5);
doc.text('under the guidance of', PAGE_W / 2, 232, { align: 'center' });
doc.setFontSize(13);
doc.text('________________________________________', PAGE_W / 2, 248, { align: 'center' });
doc.setFontSize(10);
doc.setTextColor(90, 90, 90);
doc.text('(Project Guide Name)', PAGE_W / 2, 254, { align: 'center' });

// =========================================================================
// PAGE 2: CERTIFICATE (Unnumbered)
// =========================================================================
nextPage(null);

doc.setFont('times', 'bold');
doc.setFontSize(15);
doc.setTextColor(180, 30, 30);
doc.text('______________________________________________', PAGE_W / 2, 34, { align: 'center' });
doc.setFontSize(10);
doc.setTextColor(20, 20, 20);
doc.text('(College Name & Campus Address)', PAGE_W / 2, 40, { align: 'center' });
doc.setFont('times', 'italic');
doc.setFontSize(10.5);
doc.setTextColor(20, 50, 120);
doc.text('Permanently Affiliated to the University of Mumbai', PAGE_W / 2, 49, { align: 'center' });
doc.text('Department of Computer Science / Information Technology', PAGE_W / 2, 55, { align: 'center' });

// University-style circular emblem
doc.setDrawColor(20, 20, 20);
doc.setLineWidth(0.5);
doc.circle(PAGE_W / 2, 78, 13);
doc.circle(PAGE_W / 2, 78, 11);
doc.setFont('times', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(20, 20, 20);
doc.text('UNIVERSITY', PAGE_W / 2, 76, { align: 'center' });
doc.text('EMBLEM', PAGE_W / 2, 80.5, { align: 'center' });

doc.setFont('times', 'bold');
doc.setFontSize(17);
doc.text('CERTIFICATE', PAGE_W / 2, 114, { align: 'center' });

// Subtle background watermark
doc.setFont('times', 'bold');
doc.setFontSize(34);
doc.setTextColor(235, 240, 245);
doc.text('FARMEASE', PAGE_W / 2, 152, { align: 'center' });

doc.setFont('times', 'normal');
doc.setFontSize(12.5);
doc.setTextColor(15, 15, 15);
let cy = 135;
doc.text('This is to certify that Mr. / Ms. Yash Shidruk', MARGIN_L, cy);
cy += 14;
doc.text('Seat no: _________________________, student of  T.Y.B.Sc. Computer Science / IT -', MARGIN_L, cy);
cy += 14;
doc.text('Semester V / VI   has   satisfactorily   completed   the   Project', MARGIN_L, cy);
cy += 14;
doc.setFont('times', 'bold');
doc.text('"FarmEase – AI Digital Farming Assistant",', MARGIN_L, cy);
doc.setFont('times', 'normal');
cy += 14;
doc.text('to be submitted in the partial fulfillment for the award of Bachelor of', MARGIN_L, cy);
cy += 14;
doc.setFont('times', 'bold');
doc.text('Science in Computer Science / IT during the academic year 2025 – 2026.', MARGIN_L, cy);

doc.setFont('times', 'normal');
doc.setFontSize(11.5);
doc.text('_____________________', MARGIN_L, 244);
doc.text('Professor in Charge', MARGIN_L + 3, 250);

doc.text('__________________', PAGE_W / 2 - 20, 244);
doc.text('Co-ordinator', PAGE_W / 2 - 12, 250);

doc.text('_____________________', PAGE_W - MARGIN_R - 43, 244);
doc.text('External Examiner', PAGE_W - MARGIN_R - 39, 250);

doc.text('Seal & Date:', MARGIN_L + 8, 270);

// =========================================================================
// PAGE 3: DECLARATION (Unnumbered)
// =========================================================================
nextPage(null);

doc.setFont('times', 'bold');
doc.setFontSize(17);
doc.setTextColor(15, 15, 15);
doc.text('DECLARATION', PAGE_W / 2, 34, { align: 'center' });

cy = 72;
doc.setFont('times', 'normal');
doc.setFontSize(11.5);
const declLines = [
  'I, Yash Shidruk, hereby declare that the project',
  'entitled "FarmEase – AI Digital Farming Assistant" submitted in',
  'the partial fulfillment for the award of Bachelor of Science in Computer Science / IT during the',
  'academic year 2025 – 2026 is my original work and the project has not formed the basis for',
  'the award of any degree, associateship, fellowship or any other similar titles.',
];
declLines.forEach((line) => {
  doc.text(line, MARGIN_L, cy);
  cy += 12.5;
});

doc.text('Signature of the Student:', MARGIN_L, 215);
doc.text('Place: Mumbai', MARGIN_L, 227);
doc.text('Date:', MARGIN_L, 239);

// =========================================================================
// PAGE 4: ACKNOWLEDGEMENT (Unnumbered)
// =========================================================================
nextPage(null);

doc.setFont('times', 'bold');
doc.setFontSize(17);
doc.text('ACKNOWLEDGEMENT', PAGE_W / 2, 34, { align: 'center' });

cy = 56;
const ackParas = [
  'I would like to express my sincere gratitude to all those who contributed to the successful completion of this project in this semester.',
  'Firstly, I would like to thank my project guide for their valuable guidance, continuous support, and encouragement throughout this project. Their expertise and constructive feedback helped me improve my work at every stage.',
  'I also extend my thanks to the faculty of Department of Computer Science / Information Technology for providing me with the opportunity to undertake this project and for offering the necessary resources and learning environment.',
  'I would also like to acknowledge my friends and classmates for their constant encouragement and collaboration during the course of this project. Their motivation kept me focused and driven.',
  'Finally, I am deeply grateful to my family for their unwavering support and belief in me. Without their understanding and encouragement, completing this project in this semester would not have been possible.',
  'Thank you all.',
];
ackParas.forEach((p) => {
  cy = writeParagraph(p, MARGIN_L, cy, CONTENT_W, 6.2, 0, 'normal', 11.5);
  cy += 3;
});

// =========================================================================
// PAGES 5-7: TABLE OF CONTENTS (Unnumbered)
// =========================================================================
nextPage(null);
doc.setFont('times', 'bold');
doc.setFontSize(17);
doc.text('TABLE OF CONTENTS', PAGE_W / 2, 32, { align: 'center' });

cy = 48;
cy = drawTocLine('CHAPTER 1 PRELIMINARY INVESTIGATION', '1', MARGIN_L, cy, true, 0);
cy = drawTocLine('1.1. Organizational Overview', '1', MARGIN_L, cy, false, 8);
cy = drawTocLine('1.2. Description of System', '2', MARGIN_L, cy, false, 8);
cy = drawTocLine('1.3. Limitations of Present System', '2', MARGIN_L, cy, false, 8);
cy = drawTocLine('1.4. Proposed System and Advantages of the Proposed System', '4', MARGIN_L, cy, false, 8);
cy = drawTocLine('1.4.1. Proposed System', '4', MARGIN_L, cy, false, 16);
cy = drawTocLine('1.4.2. Advantages of the Proposed System', '4', MARGIN_L, cy, false, 16);
cy = drawTocLine('1.5. Feasibility Study', '5', MARGIN_L, cy, false, 8);
cy = drawTocLine('1.5.1. Technical Feasibility', '5', MARGIN_L, cy, false, 16);
cy = drawTocLine('1.5.2. Operational Feasibility', '6', MARGIN_L, cy, false, 16);
cy = drawTocLine('1.5.3. Financial Feasibility', '6', MARGIN_L, cy, false, 16);
cy = drawTocLine('1.6. Stakeholders', '7', MARGIN_L, cy, false, 8);
cy = drawTocLine('1.6.1. Primary Stakeholders', '7', MARGIN_L, cy, false, 16);
cy = drawTocLine('1.6.2. Secondary Stakeholders', '7', MARGIN_L, cy, false, 16);
cy = drawTocLine('1.6.3. Tertiary Stakeholders', '7', MARGIN_L, cy, false, 16);
cy = drawTocLine('1.7. Technologies Used', '8', MARGIN_L, cy, false, 8);
cy = drawTocLine('1.7.1. Frontend Technologies', '8', MARGIN_L, cy, false, 16);
cy = drawTocLine('1.7.2. Backend Technologies', '8', MARGIN_L, cy, false, 16);
cy = drawTocLine('1.7.3. Additional Tools', '9', MARGIN_L, cy, false, 16);
cy = drawTocLine('1.8. Gantt Chart', '9', MARGIN_L, cy, false, 8);
cy = drawTocLine('CHAPTER 2 SYSTEM ANALYSIS', '11', MARGIN_L, cy + 1, true, 0);
cy = drawTocLine('2.1. Fact Finding Techniques', '11', MARGIN_L, cy, false, 8);
cy = drawTocLine('2.1.1. Questionnaires', '11', MARGIN_L, cy, false, 16);
cy = drawTocLine('2.1.2. Prototyping', '11', MARGIN_L, cy, false, 16);

nextPage(null);
cy = 34;
cy = drawTocLine('2.1.3. Surveys', '11', MARGIN_L, cy, false, 16);
cy = drawTocLine('2.2. Use Case Diagram', '12', MARGIN_L, cy, false, 8);
cy = drawTocLine('2.2.1. Use Case Description', '13', MARGIN_L, cy, false, 16);
cy = drawTocLine('2.3. Activity Diagram', '14', MARGIN_L, cy, false, 8);
cy = drawTocLine('2.3.1. Activity Diagram (A)', '14', MARGIN_L, cy, false, 16);
cy = drawTocLine('2.3.2. Activity Diagram (B)', '15', MARGIN_L, cy, false, 16);
cy = drawTocLine('2.4. Class Diagram', '16', MARGIN_L, cy, false, 8);
cy = drawTocLine('2.4.1. Class Diagram (A)', '16', MARGIN_L, cy, false, 16);
cy = drawTocLine('2.4.2. Class Diagram (B)', '17', MARGIN_L, cy, false, 16);
cy = drawTocLine('2.5. Sequence Diagram', '18', MARGIN_L, cy, false, 8);
cy = drawTocLine('2.5.1. Sequence Diagram (A)', '18', MARGIN_L, cy, false, 16);
cy = drawTocLine('2.5.2. Sequence Diagram (B)', '19', MARGIN_L, cy, false, 16);
cy = drawTocLine('CHAPTER 3 SYSTEM DESIGN', '20', MARGIN_L, cy + 2, true, 0);
cy = drawTocLine('3.1. Data Design Diagram', '20', MARGIN_L, cy, false, 8);
cy = drawTocLine('3.2. Data Flow Diagrams', '21', MARGIN_L, cy, false, 8);
cy = drawTocLine('3.3. Component Diagram', '23', MARGIN_L, cy, false, 8);
cy = drawTocLine('3.4. Package Diagram', '25', MARGIN_L, cy, false, 8);
cy = drawTocLine('3.5. Deployment Diagram', '27', MARGIN_L, cy, false, 8);
cy = drawTocLine('CHAPTER 4 SYSTEM CODING', '28', MARGIN_L, cy + 2, true, 0);
cy = drawTocLine('4.1. Navigation Tree', '28', MARGIN_L, cy, false, 8);
cy = drawTocLine('4.1.1. Navigation Tree (A)', '28', MARGIN_L, cy, false, 16);
cy = drawTocLine('4.1.2. Navigation Tree (B)', '29', MARGIN_L, cy, false, 16);
cy = drawTocLine('4.2. Program Description', '30', MARGIN_L, cy, false, 8);
cy = drawTocLine('4.3. Validations', '57', MARGIN_L, cy, false, 8);
cy = drawTocLine('4.4. Test Cases', '58', MARGIN_L, cy, false, 8);

nextPage(null);
cy = 34;
cy = drawTocLine('4.5. Test Data and Test Results', '59', MARGIN_L, cy, false, 8);
cy = drawTocLine('4.5.1. User Authentication', '59', MARGIN_L, cy, false, 16);
cy = drawTocLine('4.5.2. New Farmer Sign Up', '60', MARGIN_L, cy, false, 16);
cy = drawTocLine('4.5.3. AI Crop Recommendation Engine', '61', MARGIN_L, cy, false, 16);
cy = drawTocLine('4.5.4. AI Disease Detection & Weather Advisory', '61', MARGIN_L, cy, false, 16);
cy = drawTocLine('4.5.5. Summary of Test Results', '62', MARGIN_L, cy, false, 16);
cy = drawTocLine('CHAPTER 5 SCREEN LAYOUTS & REPORT LAYOUTS', '63', MARGIN_L, cy + 2, true, 0);
cy = drawTocLine('5.1. Home Hero & Farmer Login Page', '63', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.2. New Farmer Sign-Up Page & Farmer Dashboard', '63', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.3. AI Crop Recommendation Input & Output Section', '64', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.4. AI Plant Disease Scanner & Diagnosis Report', '64', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.5. Disease Sample Presets & Farmer Profile Page', '65', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.6. Weather Intelligence & Spray Advisory Page', '65', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.7. 7-Day Weather Forecast Section', '66', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.8. Smart Farm Insights & Yield Analytics', '67', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.9. Soil Moisture Trend & Disease Risk Matrix', '67', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.10. Voice Agronomic Assistant & Alerts Dropdown', '68', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.11. Profile Settings & Registration Metadata', '68', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.12. Multilingual Selector & Accessibility Mode', '69', MARGIN_L, cy, false, 8);
cy = drawTocLine('5.13. Mobile Navigation & Activity History View', '69', MARGIN_L, cy, false, 8);
cy = drawTocLine('CHAPTER 6 SUMMARY', '70', MARGIN_L, cy + 2, true, 0);
cy = drawTocLine('CHAPTER 7 FUTURE ENHANCEMENTS', '72', MARGIN_L, cy + 2, true, 0);
cy = drawTocLine('CHAPTER 8 REFERENCES', '73', MARGIN_L, cy + 2, true, 0);

// =========================================================================
// PAGE 8 (1 | P a g e): CHAPTER 1 - 1.1 Organizational Overview
// =========================================================================
nextPage(1);
cy = drawChapterHeader(1, 'PRELIMINARY INVESTIGATION', 28);
cy = drawSectionHeading('1.1. Organizational Overview', MARGIN_L, cy, 14);
cy = writeParagraph(
  'FarmEase (AI Digital Farming Assistant) is a modern full-stack web platform designed to empower farmers with precision agronomic intelligence, multimodal plant disease diagnostics, and hyper-local weather advisories. In a world where agricultural decision-making is often slowed down by fragmented soil labs, delayed pathology inspections, and unpredictable weather shifts, FarmEase simplifies how farmers plan crops, protect harvests, and monitor farm health from any smartphone or desktop browser.',
  MARGIN_L, cy, CONTENT_W, 5.4, 0, 'normal', 10.8
);
cy = writeParagraph(
  'At the heart of FarmEase’s mission is bridging the technological divide in rural agriculture by providing an intuitive, multilingual, voice-assisted experience. The platform adapts to both smallholder farmers managing 1–5 acre plots and large commercial farms, transforming complex soil pH, climate, and foliar symptom data into clear, actionable guidance.',
  MARGIN_L, cy, CONTENT_W, 5.4, 0, 'normal', 10.8
);

cy = writeBullet('✓', 'Features and Functionality', '', MARGIN_L, cy + 2, CONTENT_W, 5.4, 11);
cy = writeParagraph(
  'FarmEase’s core functionality revolves around six integrated modules. Farmers can authenticate securely via Mobile OTP, Email/Password, or New Farmer Registration, storing their plot size, soil type, district location, and primary crops persistently. Inside the Dashboard, farmers view an AI Farm Health Score (88%), live weather conditions, saved crop recommendations, and recent leaf disease scans.',
  MARGIN_L + 4, cy - 1, CONTENT_W - 4, 5.4, 0, 'normal', 10.6
);
cy = writeParagraph(
  'Through the AI Crop Recommendation Engine powered by Google Gemini, farmers input soil classification, soil pH, water availability, temperature, sowing season (Kharif, Rabi, Zaid), and previous crop to receive suitability scores, expected yields per hectare, profitability estimates, and practical care tips. Through the AI Plant Pathology Scanner, farmers upload or capture leaf photographs via their device camera to diagnose diseases such as Tomato Early Blight or Wheat Yellow Rust with confidence scores, visible symptoms, and treatment steps.',
  MARGIN_L + 4, cy - 1, CONTENT_W - 4, 5.4, 0, 'normal', 10.6
);

cy = writeBullet('✓', 'Inclusivity and Accessibility', '', MARGIN_L, cy + 2, CONTENT_W, 5.4, 11);
cy = writeParagraph(
  'FarmEase prioritizes rural inclusivity by supporting 6 Indian languages (English, Hindi, Marathi, Tamil, Telugu, and Kannada), a 1-click Large Text accessibility mode for outdoor readability, and a built-in Web Speech API Voice Assistant that reads advisories aloud and supports voice dictation. Combined with automatic algorithmic fallbacks when offline or in low-connectivity areas, FarmEase guarantees dependable decision support for every farmer.',
  MARGIN_L + 4, cy - 1, CONTENT_W - 4, 5.4, 0, 'normal', 10.6
);

// =========================================================================
// PAGE 9 (2 | P a g e): 1.2 Description of System & 1.3 Limitations
// =========================================================================
nextPage(2);
cy = drawSectionHeading('1.2. Description of System', MARGIN_L, 28, 14);
cy = writeParagraph(
  'FarmEase is a responsive React 19, TypeScript, Express.js, and Google Gemini AI web application engineered to provide real-time agricultural decision support. The platform integrates farmer identity management, precision crop selection, computer-vision leaf diagnostics, microclimate forecasting, and farm analytics into a single cohesive portal.',
  MARGIN_L, cy, CONTENT_W, 5.3, 0, 'normal', 10.6
);
cy = writeBullet('❖', 'For Farmers (Primary End Users)', '', MARGIN_L + 4, cy, CONTENT_W - 4, 5.2, 10.8);
cy = writeBullet('o', '', 'Multi-Mode Authentication: Farmers can log in using Mobile OTP (4-digit SMS code), Email/Password, 1-click Demo Profiles, or register a new farm plot via Sign Up.', MARGIN_L + 10, cy - 1, CONTENT_W - 10, 5.1, 10.3);
cy = writeBullet('o', '', 'AI Crop Recommendation: Evaluates location, soil type, soil pH, water availability, temperature, and season to output top crop matches with yield and profitability.', MARGIN_L + 10, cy - 1, CONTENT_W - 10, 5.1, 10.3);
cy = writeBullet('o', '', 'AI Plant Disease Doctor: Farmers upload leaf photos or use their camera to identify fungal/bacterial pathogens, view confidence scores, and receive organic/chemical treatments.', MARGIN_L + 10, cy - 1, CONTENT_W - 10, 5.1, 10.3);
cy = writeBullet('o', '', 'Weather & Insights: Real-time temperature, humidity, rain probability, spray suitability advisories, 7-day forecasts, and interactive Recharts yield analytics.', MARGIN_L + 10, cy - 1, CONTENT_W - 10, 5.1, 10.3);

cy = writeBullet('❖', 'For Agronomists & Extension Support', '', MARGIN_L + 4, cy + 1, CONTENT_W - 4, 5.2, 10.8);
cy = writeBullet('o', '', 'Structured Diagnostic Logs: Saved crop recommendations and timestamped leaf pathology scans allow extension workers to review farm history accurately.', MARGIN_L + 10, cy - 1, CONTENT_W - 10, 5.1, 10.3);
cy = writeBullet('o', '', 'Multilingual & Voice Interface: Supports 6 regional languages and Text-to-Speech readouts for farmers with limited reading proficiency.', MARGIN_L + 10, cy - 1, CONTENT_W - 10, 5.1, 10.3);

cy = drawSectionHeading('1.3. Limitations of Present System', MARGIN_L, cy + 4, 14);
cy = writeParagraph(
  'In traditional agricultural advisory workflows and legacy portals, farmers routinely encounter severe bottlenecks that delay critical crop interventions:',
  MARGIN_L, cy, CONTENT_W, 5.2, 0, 'normal', 10.5
);
cy = writeBullet('➢', 'Delayed Laboratory & Expert Access', 'Traditional soil testing and plant pathology labs require farmers to travel to district Krishi Vigyan Kendras and wait days or weeks for results, during which contagious blight or rust can destroy entire fields.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.2, 10.4);
cy = writeBullet('➢', 'High Consultation & Input Costs', 'Without accurate crop-soil matching and targeted disease identification, farmers often overspend on incorrect fertilizers or broad-spectrum pesticides, shrinking already thin profit margins.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.2, 10.4);

// =========================================================================
// PAGE 10 (3 | P a g e): 1.3 Limitations contd.
// =========================================================================
nextPage(3);
cy = 30;
cy = writeBullet('➢', 'Poor User Interface in Legacy Portals', 'Many government and commercial agriculture websites have cluttered, desktop-only interfaces that fail to render properly on rural mobile screens. Non-intuitive navigation causes farmers to abandon digital tools.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.6, 10.8);
cy += 4;
cy = writeBullet('➢', 'Lack of Real-Time Microclimate & Spray Advisory', 'Generic television or newspaper weather forecasts only provide city-wide summaries without actionable agricultural advice. Farmers frequently apply costly foliar sprays hours before unexpected afternoon rain, resulting in complete wash-off.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.6, 10.8);
cy += 4;
cy = writeBullet('➢', 'Lack of Localized Educational & Crop Care Resources', 'Existing platforms rarely explain why a crop suits a specific soil pH or what preventive rotation steps stop fungal carryover, leaving farmers without foundational agronomic guidance.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.6, 10.8);
cy += 4;
cy = writeBullet('➢', 'Language & Literacy Barriers', 'Technical farming portals published exclusively in English exclude millions of regional farmers who think and operate in Hindi, Marathi, Tamil, Telugu, or Kannada.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.6, 10.8);
cy += 4;
cy = writeBullet('➢', 'Disconnected Tools & Zero Offline Resilience', 'Farmers previously needed separate apps for weather, soil calculators, and pest encyclopedias—and most crashed completely whenever rural mobile internet dropped.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.6, 10.8);

// =========================================================================
// PAGE 11 (4 | P a g e): 1.4 Proposed System & Advantages
// =========================================================================
nextPage(4);
cy = drawSectionHeading('1.4. Proposed System and Advantages of the Proposed System', MARGIN_L, 28, 14);
cy = drawSubHeading('1.4.1. Proposed System', MARGIN_L, cy + 2, 12);
cy = writeParagraph(
  'The proposed FarmEase system overcomes the limitations of legacy agricultural advisory platforms by uniting AI agronomy, computer-vision plant pathology, weather intelligence, and farm analytics inside a fast, mobile-first Single Page Application (SPA).',
  MARGIN_L, cy, CONTENT_W, 5.3, 0, 'normal', 10.5
);
cy = writeParagraph(
  'FarmEase allows farmers to create and manage persistent farm profiles storing location, plot size, soil type, and primary crops. Using the AI Crop Advisor, farmers simulate soil pH, water availability, and seasonal conditions to receive ranked crop matches with yield and profitability projections. Using the AI Leaf Disease Scanner, farmers snap or upload photos of suspicious leaves and immediately receive pathogen classification, symptom checklists, and step-by-step organic or chemical treatments.',
  MARGIN_L, cy, CONTENT_W, 5.3, 0, 'normal', 10.5
);
cy = writeParagraph(
  'Furthermore, FarmEase integrates a 7-day meteorological dashboard with automated irrigation and spraying flags, interactive Recharts moisture/yield graphs, 6-language UI translation, Large Text accessibility, and a Web Speech API voice assistant—ensuring instant usability for every farmer.',
  MARGIN_L, cy, CONTENT_W, 5.3, 0, 'normal', 10.5
);

cy = drawSubHeading('1.4.2. Advantages of the Proposed System', MARGIN_L, cy + 3, 12);
const advs = [
  ['1. Instant AI Decision Support', 'Replaces multi-day manual lab waits with sub-2-second AI crop recommendations and leaf pathology diagnostics.'],
  ['2. Multilingual & Voice Accessibility', 'Full interface localization across English, Hindi, Marathi, Tamil, Telugu, and Kannada, paired with Listen Aloud and Voice Dictation.'],
  ['3. Cross-Device Mobile & Desktop UI', 'Built with Tailwind CSS v4 responsive grids and a dedicated mobile bottom navigation bar for effortless field use.'],
  ['4. Actionable Weather & Spray Guidance', 'Translates raw humidity, wind speed, and rainfall probability into clear irrigation, spraying, and fungal risk alerts.'],
  ['5. High Availability & Offline Fallback', 'Includes deterministic client-side fallback engines and localStorage profile persistence so core workflows work even on weak rural networks.'],
  ['6. Cost Optimization & Higher Yields', 'Helps farmers choose high-margin crops suited to their soil pH and catch blight or rust early before yield loss escalates.'],
];
advs.forEach(([b, t]) => {
  cy = writeBullet('', b, t, MARGIN_L + 2, cy, CONTENT_W - 2, 5.1, 10.3);
});

// =========================================================================
// PAGE 12 (5 | P a g e): 1.5 Feasibility Study (Technical)
// =========================================================================
nextPage(5);
cy = drawSectionHeading('1.5. Feasibility Study', MARGIN_L, 28, 14);
cy = writeParagraph(
  'A feasibility study for FarmEase assesses the viability of the proposed web application across technical, operational, and financial dimensions prior to full-scale deployment.',
  MARGIN_L, cy, CONTENT_W, 5.4, 0, 'normal', 10.6
);
cy = drawSubHeading('1.5.1. Technical Feasibility', MARGIN_L, cy + 2, 12);
cy = writeBullet('1.', 'Technology Required', '', MARGIN_L + 2, cy, CONTENT_W - 2, 5.4, 11);
cy = writeBullet('A.', 'React 19, TypeScript & Tailwind CSS', 'Provides a type-safe, modular frontend Single Page Application with instant UI responsiveness and mobile accessibility.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.2, 10.4);
cy = writeBullet('B.', 'Node.js, Express.js & Google Gemini AI', 'Express proxies REST API requests securely to Google Gemini multimodal models using structured JSON response schemas.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.2, 10.4);
cy = writeBullet('C.', 'Browser localStorage & Static/Cloud Hosting', 'Enables zero-latency persistence for registered farmer profiles and seamless deployment on GitHub Pages or cloud Node servers.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.2, 10.4);

cy = writeBullet('2.', 'Development Roles & Skills', '', MARGIN_L + 2, cy + 2, CONTENT_W - 2, 5.4, 11);
cy = writeBullet('A.', 'Frontend Engineer', 'Builds responsive React components, Recharts visualizations, voice speech hooks, and multilingual translation dictionaries.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.2, 10.4);
cy = writeBullet('B.', 'Backend & AI Integration Engineer', 'Implements Express endpoints, Gemini prompt engineering, schema validation, and deterministic fallback handlers.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.2, 10.4);
cy = writeBullet('C.', 'UI/UX & Accessibility Designer', 'Designs outdoor-readable high-contrast cards, Large Text mode, and intuitive camera/upload flows for farmers.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.2, 10.4);
cy = writeBullet('D.', 'QA Engineer', 'Executes unit, integration, and cross-browser tests across authentication, crop advisor, and leaf scanner modules.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.2, 10.4);

cy = writeBullet('3.', 'Scalability', '', MARGIN_L + 2, cy + 2, CONTENT_W - 2, 5.4, 11);
cy = writeBullet('A.', 'Stateless REST Architecture', 'Server endpoints scale horizontally without session bottlenecks while client profiles persist locally.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.2, 10.4);
cy = writeBullet('B.', 'Cross-Platform Browser Reach', 'Runs directly in Chrome, Safari, Edge, and mobile browsers without requiring app-store downloads.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.2, 10.4);

// =========================================================================
// PAGE 13 (6 | P a g e): 1.5.2 Operational & 1.5.3 Financial Feasibility
// =========================================================================
nextPage(6);
cy = drawSubHeading('1.5.2. Operational Feasibility', MARGIN_L, 28, 12);
cy = writeBullet('1.', 'User-Friendly & Accessible Interface', '', MARGIN_L + 2, cy, CONTENT_W - 2, 5.4, 11);
cy = writeBullet('A.', '', 'FarmEase is built with clean card hierarchies, icon-driven navigation, and 1-click sample buttons so farmers with basic smartphone familiarity can operate it immediately.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.3, 10.5);
cy = writeBullet('B.', '', 'Minimal onboarding is required thanks to 1-click Demo Farmer profiles, auto-filled OTP codes, and regional voice audio playback.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.3, 10.5);

cy = writeBullet('2.', 'Streamlined Feature Workflows', '', MARGIN_L + 2, cy + 2, CONTENT_W - 2, 5.4, 11);
cy = writeBullet('A.', 'Farmer Onboarding', 'Quick registration captures farm location, plot size, soil type, and primary crops, automatically pre-filling subsequent AI tools.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.3, 10.5);
cy = writeBullet('B.', 'Diagnostic & Weather Integration', 'One-tap switching between Crop Advisor, Leaf Pathology Doctor, Weather Alerts, and Farm Insights streamlines daily field scouting.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.3, 10.5);

cy = writeBullet('3.', 'High Operational Adoption', '', MARGIN_L + 2, cy + 2, CONTENT_W - 2, 5.4, 11);
cy = writeBullet('A.', '', 'Addresses genuine day-to-day agricultural pain points including blight identification and spray timing.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.3, 10.5);

cy = drawSubHeading('1.5.3. Financial Feasibility', MARGIN_L, cy + 6, 12);
cy = writeBullet('1.', 'Development Costs', '', MARGIN_L + 2, cy, CONTENT_W - 2, 5.4, 11);
cy = writeBullet('A.', '', 'Built entirely using open-source frameworks (React, TypeScript, Vite, Tailwind CSS, Express.js, Recharts), eliminating software licensing fees.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.3, 10.5);
cy = writeBullet('B.', '', 'Development requires only standard commodity hardware and free open-source IDEs such as VS Code.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.3, 10.5);

cy = writeBullet('2.', 'Hosting & AI API Scaling', '', MARGIN_L + 2, cy + 2, CONTENT_W - 2, 5.4, 11);
cy = writeBullet('A.', '', 'Static frontend builds deploy free of cost via GitHub Pages, while Gemini API free/pay-as-you-go tiers keep per-scan operational costs negligible.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.3, 10.5);

// =========================================================================
// PAGE 14 (7 | P a g e): 1.5.3 contd. & 1.6 Stakeholders
// =========================================================================
nextPage(7);
cy = 30;
cy = writeBullet('3.', 'Long-Term Management', '', MARGIN_L + 2, cy, CONTENT_W - 2, 5.4, 11);
cy = writeBullet('A.', '', 'With modular REST APIs and CDN static delivery, FarmEase can start at zero infrastructure cost and scale smoothly to thousands of regional farmers.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.4, 10.6);
cy = writeBullet('B.', '', 'Future expansions such as IoT sensor telemetry or mandi API integrations can be added incrementally without rewriting core modules.', MARGIN_L + 8, cy, CONTENT_W - 8, 5.4, 10.6);

cy = drawSectionHeading('1.6. Stakeholders', MARGIN_L, cy + 8, 14);
cy = drawSubHeading('1.6.1. Primary Stakeholders', MARGIN_L, cy + 1, 11.5);
cy = writeBullet('➢', 'Farmers & Growers', 'Primary end-users who register farm plots, generate AI crop plans, scan diseased crop leaves, and monitor daily weather advisories.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.4, 10.5);
cy = writeBullet('➢', 'Farm Managers & Field Workers', 'Daily field operators who use mobile camera scanning and voice-assisted instructions during field scouting.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.4, 10.5);

cy = drawSubHeading('1.6.2. Secondary Stakeholders', MARGIN_L, cy + 4, 11.5);
cy = writeBullet('➢', 'Agricultural Extension Officers (KVKs)', 'Specialists who review saved AI diagnostic scans and guide farmers on severe regional pest outbreaks.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.4, 10.5);
cy = writeBullet('➢', 'Farmer Producer Organizations (FPOs)', 'Regional cooperatives coordinating crop planning, bulk seed/fertilizer procurement, and climate risk mitigation.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.4, 10.5);

cy = drawSubHeading('1.6.3. Tertiary Stakeholders', MARGIN_L, cy + 4, 11.5);
cy = writeBullet('➢', 'Agri-Researchers & Universities', 'Academic researchers analyzing regional crop suitability trends and foliar pathology patterns.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.4, 10.5);
cy = writeBullet('➢', 'Development & Maintenance Team', 'Software engineers responsible for maintaining AI schemas, UI localization, and system uptime.', MARGIN_L + 4, cy, CONTENT_W - 4, 5.4, 10.5);

// =========================================================================
// PAGE 15 (8 | P a g e): 1.7 Technologies Used
// =========================================================================
nextPage(8);
cy = drawSectionHeading('1.7. Technologies Used', MARGIN_L, 28, 14);
cy = drawSubHeading('1.7.1. Frontend Technologies', MARGIN_L, cy + 1, 11.5);

// React & TypeScript + Visual Icon Badge
cy = writeBullet('➢', 'React 19 & TypeScript', '', MARGIN_L + 2, cy, CONTENT_W - 2, 5.4, 11);
cy = writeParagraph(
  'React 19 serves as the declarative UI library powering FarmEase’s interactive dashboard, multi-mode authentication portal, AI recommendation forms, and leaf scanner. Combined with TypeScript 5.8, every agricultural data structure (FarmerProfile, CropRecommendation, DiseaseScan, WeatherData) is strictly type-checked at compile time to eliminate runtime UI crashes.',
  MARGIN_L + 6, cy - 1, CONTENT_W - 40, 5.2, 0, 'normal', 10.3
);
// Drawn React/TS badge on right
doc.setDrawColor(16, 185, 129);
doc.setFillColor(236, 253, 245);
doc.roundedRect(PAGE_W - MARGIN_R - 28, cy - 28, 26, 22, 3, 3, 'FD');
doc.setFont('courier', 'bold');
doc.setFontSize(10);
doc.setTextColor(6, 95, 70);
doc.text('TSX', PAGE_W - MARGIN_R - 15, cy - 15, { align: 'center' });
doc.setFontSize(7);
doc.text('React 19', PAGE_W - MARGIN_R - 15, cy - 10, { align: 'center' });

// Tailwind CSS Badge on left
cy = writeBullet('➢', 'Tailwind CSS v4 & Recharts', '', MARGIN_L + 2, cy + 4, CONTENT_W - 2, 5.4, 11);
doc.setDrawColor(14, 165, 233);
doc.setFillColor(240, 249, 255);
doc.roundedRect(MARGIN_L + 4, cy + 1, 26, 22, 3, 3, 'FD');
doc.setFont('courier', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(3, 105, 161);
doc.text('CSS', MARGIN_L + 17, cy + 13, { align: 'center' });
doc.setFontSize(7);
doc.text('Tailwind v4', MARGIN_L + 17, cy + 18, { align: 'center' });

writeParagraph(
  'Tailwind CSS v4 provides utility-first responsive styling tailored for bright outdoor sunlight readability, mobile bottom navigation bars, and accessibility scaling. Recharts 3.10 renders interactive area and bar charts for weekly soil moisture trends and crop yield projections.',
  MARGIN_L + 34, cy + 1, CONTENT_W - 34, 5.2, 0, 'normal', 10.3
);
cy += 34;

cy = drawSubHeading('1.7.2. Backend & AI Technologies', MARGIN_L, cy, 11.5);
cy = writeBullet('➢', 'Node.js, Express.js & Google Gemini AI', '', MARGIN_L + 2, cy, CONTENT_W - 2, 5.4, 11);
cy = writeParagraph(
  'The backend server (server.ts) runs on Node.js with Express 4.21, exposing secure REST endpoints (/api/crop-recommendation, /api/detect-disease, /api/weather, /api/farm-analytics). It integrates the official @google/genai SDK to run multimodal leaf vision diagnostics and structured JSON agronomic reasoning using Gemini Flash models, backed by resilient fallback algorithms.',
  MARGIN_L + 6, cy - 1, CONTENT_W - 40, 5.2, 0, 'normal', 10.3
);
// Gemini/Node badge on right
doc.setDrawColor(217, 119, 6);
doc.setFillColor(255, 251, 235);
doc.roundedRect(PAGE_W - MARGIN_R - 28, cy - 30, 26, 22, 3, 3, 'FD');
doc.setFont('courier', 'bold');
doc.setFontSize(9);
doc.setTextColor(180, 83, 9);
doc.text('AI API', PAGE_W - MARGIN_R - 15, cy - 17, { align: 'center' });
doc.setFontSize(7);
doc.text('Gemini', PAGE_W - MARGIN_R - 15, cy - 12, { align: 'center' });

// =========================================================================
// PAGE 16 (9 | P a g e): 1.7.3 Additional Tools & 1.8 Gantt Chart Table
// =========================================================================
nextPage(9);
cy = drawSubHeading('1.7.3. Additional Tools', MARGIN_L, 28, 11.5);
cy = writeBullet('➢', 'Git, GitHub & Vite Build Pipeline', '', MARGIN_L + 2, cy, CONTENT_W - 2, 5.4, 11);

// GitHub badge on left
doc.setDrawColor(30, 30, 30);
doc.setFillColor(245, 245, 245);
doc.roundedRect(MARGIN_L + 4, cy + 1, 26, 22, 3, 3, 'FD');
doc.setFillColor(20, 20, 20);
doc.circle(MARGIN_L + 17, cy + 10, 5, 'F');
doc.setFont('times', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(20, 20, 20);
doc.text('GitHub', MARGIN_L + 17, cy + 19.5, { align: 'center' });

writeParagraph(
  'Git is used as the distributed version control system to manage feature branches, track commits, and maintain clean release tags. GitHub hosts the remote repository and automates static production builds via GitHub Actions workflows (static.yml), while Vite 6.2 & esbuild bundle client and server assets for rapid deployment.',
  MARGIN_L + 34, cy + 1, CONTENT_W - 34, 5.3, 0, 'normal', 10.4
);
cy += 38;

cy = drawSectionHeading('1.8. Gantt Chart', MARGIN_L, cy, 14);
cy = drawStyledTable(
  ['Task', 'Planned Start Date', 'Planned End Date', 'Executed Start Date', 'Executed End Date'],
  [
    ['Project Proposal', '18-06-2025', '02-07-2025', '20-06-2025', '02-07-2025'],
    ['Project Initiation', '03-07-2025', '18-07-2025', '04-07-2025', '16-07-2025'],
    ['Requirements', '19-07-2025', '04-08-2025', '19-07-2025', '02-08-2025'],
    ['Design & UML', '05-08-2025', '04-09-2025', '05-08-2025', '01-09-2025'],
    ['Development', '05-09-2025', '15-10-2025', '07-09-2025', '14-10-2025'],
    ['Testing', '16-10-2025', '28-10-2025', '17-10-2025', '28-10-2025'],
    ['Deployment', '29-10-2025', '05-11-2025', '29-10-2025', '05-11-2025'],
  ],
  [44, 30.5, 30.5, 30.5, 30.5],
  MARGIN_L,
  cy,
  [235, 240, 245],
  9.5
);

// =========================================================================
// PAGE 17 (10 | P a g e): Visual Gantt Chart (Full Page)
// =========================================================================
nextPage(10);
doc.setFont('times', 'bold');
doc.setFontSize(14);
doc.text('Gantt Chart - FarmEase', PAGE_W / 2, 30, { align: 'center' });

// Draw clean visual Gantt Chart with horizontal timeline & Planned/Executed dual bars
const gX = MARGIN_L + 36;
const gY = 46;
const gW = CONTENT_W - 36;
const gH = 195;

doc.setDrawColor(180, 180, 180);
doc.setLineWidth(0.2);
const dateTicks = ['15-Jun', '05-Jul', '25-Jul', '15-Aug', '05-Sep', '25-Sep', '15-Oct', '05-Nov'];
dateTicks.forEach((lbl, idx) => {
  const tx = gX + (idx / (dateTicks.length - 1)) * gW;
  doc.line(tx, gY, tx, gY + gH);
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(lbl, tx, gY - 3, { align: 'center' });
});

const ganttBars = [
  { name: 'Project Proposal', pStart: 0.02, pEnd: 0.12, eStart: 0.03, eEnd: 0.12 },
  { name: 'Project Initiation', pStart: 0.12, pEnd: 0.22, eStart: 0.13, eEnd: 0.21 },
  { name: 'Requirements', pStart: 0.22, pEnd: 0.34, eStart: 0.22, eEnd: 0.33 },
  { name: 'Design & UML', pStart: 0.34, pEnd: 0.54, eStart: 0.34, eEnd: 0.52 },
  { name: 'Development', pStart: 0.54, pEnd: 0.82, eStart: 0.55, eEnd: 0.81 },
  { name: 'Testing', pStart: 0.82, pEnd: 0.93, eStart: 0.83, eEnd: 0.93 },
  { name: 'Deployment', pStart: 0.93, pEnd: 1.0, eStart: 0.93, eEnd: 1.0 },
];

ganttBars.forEach((task, idx) => {
  const rowY = gY + 12 + idx * 26;
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(task.name, MARGIN_L, rowY + 6);

  // Planned bar (Blue)
  doc.setFillColor(59, 130, 246);
  doc.setDrawColor(30, 64, 175);
  doc.rect(gX + task.pStart * gW, rowY, (task.pEnd - task.pStart) * gW, 6.5, 'FD');

  // Executed bar (Amber/Orange)
  doc.setFillColor(245, 158, 11);
  doc.setDrawColor(180, 83, 9);
  doc.rect(gX + task.eStart * gW, rowY + 8, (task.eEnd - task.eStart) * gW, 6.5, 'FD');
});

// Legend
doc.setFillColor(59, 130, 246);
doc.rect(MARGIN_L + 25, gY + gH + 12, 8, 5, 'F');
doc.setFont('times', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(20, 20, 20);
doc.text('Planned Duration', MARGIN_L + 36, gY + gH + 16);

doc.setFillColor(245, 158, 11);
doc.rect(MARGIN_L + 85, gY + gH + 12, 8, 5, 'F');
doc.text('Executed Duration', MARGIN_L + 96, gY + gH + 16);

// =========================================================================
// PAGE 18 (11 | P a g e): CHAPTER 2 - 2.1 Fact Finding Techniques
// =========================================================================
nextPage(11);
cy = drawChapterHeader(2, 'SYSTEM ANALYSIS', 28);
cy = drawSectionHeading('2.1. Fact Finding Techniques', MARGIN_L, cy, 14);
cy = writeParagraph(
  'Fact-finding techniques are essential in gathering accurate requirements from farmers and agronomists to understand field challenges, current workflows, and desired digital capabilities for FarmEase.',
  MARGIN_L, cy, CONTENT_W, 5.4, 0, 'normal', 10.6
);

cy = drawSubHeading('2.1.1. Questionnaires:', MARGIN_L, cy + 2, 11.5);
cy = writeParagraph(
  'Structured questionnaires were designed for farmers across Maharashtra and Punjab to gather insights on smartphone usage, language preferences, and major crop losses.',
  MARGIN_L, cy, CONTENT_W, 5.3, 0, 'normal', 10.5
);
cy = writeParagraph('Sample Questions:', MARGIN_L, cy, CONTENT_W, 5.2, 0, 'bold', 10.5);
const qList = [
  '1. How do you currently decide which crop variety to sow each Kharif or Rabi season?',
  '2. What challenges do you face when identifying leaf spots, blight, or rust on crops?',
  '3. Which Indian language and audio format do you prefer on mobile apps?',
  '4. How often has unexpected rainfall washed away your scheduled fertilizer or pesticide spray?',
  '5. Would instant AI diagnosis from a smartphone leaf photo help protect your harvest?',
];
qList.forEach((q) => {
  cy = writeParagraph(q, MARGIN_L + 6, cy - 1, CONTENT_W - 6, 5.1, 0, 'normal', 10.2);
});

cy = drawSubHeading('2.1.2. Prototyping:', MARGIN_L, cy + 3, 11.5);
cy = writeParagraph(
  'Interactive UI prototypes of FarmEase’s Login Portal, AI Crop Advisor, and Leaf Disease Scanner were created using React and Tailwind CSS. Farmers tested uploading sample leaf images and switching languages, allowing rapid refinement of button sizes, Large Text accessibility, and 1-click Demo Profiles.',
  MARGIN_L, cy, CONTENT_W, 5.3, 0, 'normal', 10.5
);

cy = drawSubHeading('2.1.3. Surveys:', MARGIN_L, cy + 3, 11.5);
cy = writeParagraph(
  'Broader surveys evaluated farmer digital literacy, mobile camera quality in outdoor sunlight, and internet reliability in rural districts—directly guiding the addition of offline client-side fallback logic and Voice Assistant audio readouts.',
  MARGIN_L, cy, CONTENT_W, 5.3, 0, 'normal', 10.5
);

// =========================================================================
// PAGE 19 (12 | P a g e): 2.2 Use Case Diagram
// =========================================================================
nextPage(12);
cy = drawSectionHeading('2.2. Use Case Diagram', MARGIN_L, 28, 14);

// System boundary
doc.setDrawColor(60, 60, 60);
doc.setFillColor(246, 240, 250);
doc.rect(48, 38, 114, 152, 'FD');
doc.setFont('times', 'bold');
doc.setFontSize(12);
doc.setTextColor(15, 15, 15);
doc.text('FarmEase', 105, 45, { align: 'center' });

// Actors
drawStickActor(26, 72, 'Farmer', [134, 239, 172]);
drawStickActor(182, 72, 'Gemini AI', [253, 224, 71]);
drawStickActor(182, 148, 'Weather API', [253, 186, 116]);

// Use Case Ovals
const useCases = [
  { x: 82, y: 58, rx: 20, ry: 7, lbl: 'Mobile OTP / Auth', fill: [186, 230, 253] },
  { x: 132, y: 58, rx: 20, ry: 7, lbl: 'New Farmer SignUp', fill: [219, 234, 254] },
  { x: 82, y: 84, rx: 21, ry: 7.5, lbl: 'AI Crop Advisor', fill: [186, 230, 253] },
  { x: 132, y: 84, rx: 21, ry: 7.5, lbl: 'Soil & pH Match', fill: [219, 234, 254] },
  { x: 82, y: 112, rx: 21, ry: 7.5, lbl: 'Scan Leaf Disease', fill: [186, 230, 253] },
  { x: 132, y: 112, rx: 21, ry: 7.5, lbl: 'Pathology Report', fill: [219, 234, 254] },
  { x: 82, y: 140, rx: 21, ry: 7.5, lbl: 'Weather & Spray', fill: [186, 230, 253] },
  { x: 132, y: 140, rx: 21, ry: 7.5, lbl: 'Farm Insights', fill: [186, 230, 253] },
  { x: 105, y: 168, rx: 23, ry: 7.5, lbl: 'Voice Read & Profile', fill: [186, 230, 253] },
];

useCases.forEach((uc) => {
  doc.setFillColor(...uc.fill);
  doc.setDrawColor(40, 40, 40);
  doc.ellipse(uc.x, uc.y, uc.rx, uc.ry, 'FD');
  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 15, 15);
  doc.text(uc.lbl, uc.x, uc.y + 1.5, { align: 'center' });
});

// Associations
drawArrow(32, 70, 62, 59);
drawArrow(32, 73, 61, 84);
drawArrow(32, 76, 61, 112);
drawArrow(32, 79, 61, 140);
drawArrow(32, 82, 82, 168);

drawArrow(102, 58, 112, 58, true); // include
drawArrow(103, 84, 111, 84, true);
drawArrow(103, 112, 111, 112, true);

drawArrow(176, 72, 153, 84);
drawArrow(176, 74, 153, 112);
drawArrow(176, 148, 103, 140);
drawArrow(176, 148, 153, 140);

// Use case shape key legend box (matching sample!)
doc.setDrawColor(140, 140, 140);
doc.setFillColor(252, 252, 252);
doc.roundedRect(62, 204, 86, 52, 3, 3, 'FD');
doc.setFont('times', 'bold');
doc.setFontSize(11);
doc.text('Use case shape key', 68, 213);
drawStickActor(73, 224, '', [255, 255, 255]);
doc.setFont('times', 'normal');
doc.setFontSize(10);
doc.text('Actor', 82, 226);

doc.setFillColor(186, 230, 253);
doc.ellipse(73, 234, 5, 2.5, 'FD');
doc.text('Use case', 82, 235.5);

doc.setFillColor(219, 234, 254);
doc.ellipse(73, 242, 5, 2.5, 'FD');
doc.text('Use case extension', 82, 243.5);

doc.setFillColor(255, 255, 255);
doc.rect(69, 247.5, 8, 4.5, 'FD');
doc.text('System', 82, 251);

// =========================================================================
// PAGE 20 (13 | P a g e): 2.2.1 Use Case Description
// =========================================================================
nextPage(13);
cy = drawSubHeading('2.2.1. Use Case Description', MARGIN_L, 28, 12);
cy = writeBullet('✓', 'Actors', '', MARGIN_L, cy, CONTENT_W, 5.3, 11);
cy = writeBullet('□', 'Farmer (Green)', 'Represents the primary user who signs in, configures farm profile parameters, requests crop plans, scans leaf images, and views weather forecasts.', MARGIN_L + 6, cy, CONTENT_W - 6, 5.1, 10.2);
cy = writeBullet('□', 'Gemini AI (Yellow)', 'Represents the multimodal Google Gemini Flash engine processing soil/climate prompts and leaf pathology images.', MARGIN_L + 6, cy, CONTENT_W - 6, 5.1, 10.2);
cy = writeBullet('□', 'Weather API (Orange)', 'Represents the hyper-local weather intelligence service returning 7-day forecasts and spray advisories.', MARGIN_L + 6, cy, CONTENT_W - 6, 5.1, 10.2);

cy = writeBullet('✓', 'Use Cases', '', MARGIN_L, cy + 2, CONTENT_W, 5.3, 11);
const ucs = [
  ['Mobile OTP / Auth', 'Farmers sign in using 4-digit OTP verification, email/password, or 1-click demo profiles.'],
  ['New Farmer SignUp', 'New farmers register their name, mobile, location, plot size, soil type, and primary crops into persistent storage.'],
  ['AI Crop Advisor', 'Farmers submit soil, pH, temperature, water, and season parameters to receive suitability scores and expected yields.'],
  ['Soil & pH Match', 'Extended analysis evaluating nitrogen balance after the farmer’s previous crop cycle.'],
  ['Scan Leaf Disease', 'Farmers upload or capture a leaf photo via camera or select sample leaf presets for analysis.'],
  ['Pathology Report', 'Displays disease classification, confidence percentage, visible symptoms, treatments, and prevention tips.'],
  ['Weather & Spray', 'Shows real-time temperature, humidity, rainfall risk, and spraying/irrigation recommendations.'],
  ['Farm Insights', 'Visualizes weekly soil moisture trends, yield targets, and crop disease risk matrices using charts.'],
  ['Voice Read & Profile', 'Enables hands-free voice readout in 6 regional languages and farm profile editing.'],
];
ucs.forEach(([u, d]) => {
  cy = writeBullet('□', u, d, MARGIN_L + 6, cy - 0.5, CONTENT_W - 6, 4.9, 10);
});

cy = writeBullet('✓', 'Connections', '', MARGIN_L, cy + 2, CONTENT_W, 5.3, 11);
cy = writeBullet('□', '', 'Solid lines represent two-way communication between an actor and a use case.', MARGIN_L + 6, cy, CONTENT_W - 6, 5, 10.2);
cy = writeBullet('□', '', 'Dashed lines indicate <<include>> or <<extend>> relationships between two use cases.', MARGIN_L + 6, cy, CONTENT_W - 6, 5, 10.2);

// =========================================================================
// PAGE 21 (14 | P a g e): 2.3 Activity Diagram (A)
// =========================================================================
nextPage(14);
cy = drawSectionHeading('2.3. Activity Diagram', MARGIN_L, 28, 14);
cy = drawSubHeading('2.3.1. Activity Diagram (A) — Farmer Onboarding & AI Crop Advisor', MARGIN_L, cy, 11.5);

doc.setDrawColor(100, 100, 100);
doc.rect(35, 48, 140, 215);
doc.setFillColor(187, 247, 208);
doc.rect(35, 55, 140, 5, 'F');
doc.setFont('times', 'bold');
doc.setFontSize(9.5);
doc.text('FarmEase (Crop Advisory Flow)', 105, 52.5, { align: 'center' });

// Start node
doc.setFillColor(15, 15, 15);
doc.circle(105, 68, 3, 'F');
drawArrow(105, 71, 105, 77);

const actBox = (cx, cyb, lbl) => {
  doc.setFillColor(187, 247, 208);
  doc.setDrawColor(40, 40, 40);
  doc.roundedRect(cx - 18, cyb - 4.5, 36, 9, 2, 2, 'FD');
  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 15, 15);
  doc.text(lbl, cx, cyb + 1, { align: 'center' });
};

const actDiamond = (cx, cyb, lbl) => {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(40, 40, 40);
  doc.line(cx, cyb - 7, cx + 12, cyb);
  doc.line(cx + 12, cyb, cx, cyb + 7);
  doc.line(cx, cyb + 7, cx - 12, cyb);
  doc.line(cx - 12, cyb, cx, cyb - 7);
  doc.setFont('times', 'normal');
  doc.setFontSize(6.5);
  doc.text(lbl, cx, cyb + 1, { align: 'center' });
};

actBox(105, 81.5, 'Login / Auth Portal');
drawArrow(105, 86, 105, 93);
actDiamond(105, 100, 'Registered?');
drawArrow(93, 100, 63, 100);
drawArrow(63, 100, 63, 108);
drawArrow(117, 100, 147, 100);
drawArrow(147, 100, 147, 108);

doc.setFontSize(7);
doc.text('YES', 78, 98.5);
doc.text('NO', 130, 98.5);

actBox(63, 112.5, 'OTP / Password');
actBox(147, 112.5, 'New Farmer SignUp');
drawArrow(63, 117, 63, 126);
drawArrow(147, 117, 147, 126);
actDiamond(63, 133, 'Valid?');
actBox(147, 130.5, 'Save localStorage');
drawArrow(75, 133, 95, 133);
actBox(105, 133, 'Auth Error');
doc.setFontSize(6.5);
doc.text('NO', 83, 131.5);
drawArrow(63, 140, 63, 148);
drawArrow(63, 148, 105, 148);
drawArrow(147, 135, 147, 148);
drawArrow(147, 148, 105, 148);
drawArrow(105, 148, 105, 154);

actBox(105, 158.5, 'Farmer Dashboard');
drawArrow(105, 163, 105, 169);
actBox(105, 173.5, 'Open Crop Advisor');
drawArrow(105, 178, 105, 184);
actBox(105, 188.5, 'Input Soil & Season');
drawArrow(105, 193, 105, 199);
actBox(105, 203.5, 'Gemini AI Analysis');
drawArrow(105, 208, 105, 214);
actBox(105, 218.5, 'View Yield & Tips');
drawArrow(105, 223, 105, 229);
actBox(105, 233.5, 'Save to Profile');
drawArrow(105, 238, 105, 246);

// End bullseye
doc.setDrawColor(15, 15, 15);
doc.circle(105, 250, 4);
doc.setFillColor(15, 15, 15);
doc.circle(105, 250, 2.2, 'F');

// =========================================================================
// PAGE 22 (15 | P a g e): 2.3.2 Activity Diagram (B)
// =========================================================================
nextPage(15);
cy = drawSubHeading('2.3.2. Activity Diagram (B) — Leaf Pathology Scan & Weather Flow', MARGIN_L, 28, 11.5);

doc.setDrawColor(100, 100, 100);
doc.rect(35, 42, 140, 220);
doc.setFillColor(187, 247, 208);
doc.rect(35, 49, 140, 5, 'F');
doc.setFont('times', 'bold');
doc.setFontSize(9.5);
doc.text('FarmEase (Disease & Weather Flow)', 105, 46.5, { align: 'center' });

doc.setFillColor(15, 15, 15);
doc.circle(105, 62, 3, 'F');
drawArrow(105, 65, 105, 72);
actBox(105, 76.5, 'Select Module');
drawArrow(105, 81, 105, 89);
actDiamond(105, 96, 'Mode?');
drawArrow(93, 96, 65, 96);
drawArrow(65, 96, 65, 106);
drawArrow(117, 96, 145, 96);
drawArrow(145, 96, 145, 106);
doc.setFontSize(6.5);
doc.text('Leaf Scan', 76, 94.5);
doc.text('Weather', 128, 94.5);

actBox(65, 110.5, 'Upload / Snap Leaf');
drawArrow(65, 115, 65, 123);
actBox(65, 127.5, 'Select Crop Hint');
drawArrow(65, 132, 65, 140);
actBox(65, 144.5, 'Gemini Vision Scan');
drawArrow(65, 149, 65, 157);
actBox(65, 161.5, 'Symptoms & Cure');
drawArrow(65, 166, 65, 174);
actBox(65, 178.5, 'Save Scan History');

actBox(145, 110.5, 'Enter District');
drawArrow(145, 115, 145, 123);
actBox(145, 127.5, 'Fetch Weather API');
drawArrow(145, 132, 145, 140);
actBox(145, 144.5, 'Rain & Spray Check');
drawArrow(145, 149, 145, 157);
actBox(145, 161.5, '7-Day Forecast');
drawArrow(145, 166, 145, 174);
actBox(145, 178.5, 'Show Risk Alerts');

drawArrow(65, 183, 65, 194);
drawArrow(65, 194, 105, 194);
drawArrow(145, 183, 145, 194);
drawArrow(145, 194, 105, 194);
drawArrow(105, 194, 105, 202);

actBox(105, 206.5, 'Voice Readout (TTS)');
drawArrow(105, 211, 105, 220);
actBox(105, 224.5, 'Update Dashboard');
drawArrow(105, 229, 105, 240);

doc.setDrawColor(15, 15, 15);
doc.circle(105, 244, 4);
doc.setFillColor(15, 15, 15);
doc.circle(105, 244, 2.2, 'F');

// =========================================================================
// PAGE 23 (16 | P a g e): 2.4 Class Diagram (A)
// =========================================================================
nextPage(16);
cy = drawSectionHeading('2.4. Class Diagram — 2.4.1. Class Diagram (A) (Auth & Core UI)', MARGIN_L, 28, 12.5);

drawBox(75, 38, 60, 38, 'App', [
  '- currentTab: string',
  '- language: Language',
  '- user: FarmerProfile | null',
  '- weather: WeatherData | null',
], [
  '+ handleUserChange()',
  '+ handleOpenAuth()',
  '+ handleSaveRecommendation()',
]);

drawBox(22, 92, 54, 44, 'LoginPage', [
  '- authMode: otp|password|signup',
  '- otpPhone: string',
  '- otpCode: string',
  '- signupName: string',
], [
  '+ handleSendOtp()',
  '+ handleVerifyOtp()',
  '+ handlePasswordLogin()',
  '+ handleSignUp()',
]);

drawBox(134, 92, 54, 42, 'Navbar', [
  '- mobileMenuOpen: boolean',
  '- alertsOpen: boolean',
  '+ navItems: NavItem[]',
], [
  '+ setCurrentTab()',
  '+ setLanguage()',
  '+ setIsLargeText()',
  '+ onLogout()',
]);

drawBox(22, 154, 54, 40, 'ProfileView', [
  '- name: string',
  '- location: string',
  '- farmSize: string',
  '- mainCrops: string',
], [
  '+ handleSubmit()',
  '+ onUpdateUser()',
  '+ onLogout()',
]);

drawBox(134, 154, 54, 42, 'Dashboard', [
  '+ user: FarmerProfile',
  '+ weather: WeatherData',
  '+ savedRecommendations[]',
  '+ diseaseScans[]',
], [
  '+ renderHealthGauge()',
  '+ onNavigate()',
]);

drawBox(76, 212, 58, 44, 'FarmerProfile', [
  '+ id: string',
  '+ name: string',
  '+ email: string',
  '+ phone: string',
  '+ location: string',
  '+ farmSize: number',
  '+ soilType: string',
  '+ mainCrops: string[]',
], []);

drawArrow(75, 58, 49, 92);
drawArrow(135, 58, 161, 92);
drawArrow(105, 76, 105, 212);
drawArrow(49, 136, 49, 154);
drawArrow(161, 134, 161, 154);
drawArrow(76, 185, 92, 212);
drawArrow(134, 185, 118, 212);

// =========================================================================
// PAGE 24 (17 | P a g e): 2.4.2 Class Diagram (B)
// =========================================================================
nextPage(17);
cy = drawSubHeading('2.4.2. Class Diagram (B) — AI Agronomy, Pathology & Weather', MARGIN_L, 28, 12);

drawBox(22, 42, 54, 44, 'CropRecommendationView', [
  '- formData: CropInput',
  '- loading: boolean',
  '- result: CropRecommendation',
  '- saved: boolean',
], [
  '+ handleSubmit()',
  '+ handleSave()',
  '+ handleVoiceInput()',
]);

drawBox(134, 42, 54, 44, 'DiseaseDetectionView', [
  '- imagePreview: string',
  '- cropHint: string',
  '- scanResult: DiseaseScan',
  '- cameraActive: boolean',
], [
  '+ processFile()',
  '+ capturePhoto()',
  '+ triggerAnalysis()',
]);

drawBox(22, 104, 54, 40, 'WeatherView', [
  '- weather: WeatherData',
  '- searchQuery: string',
  '- loading: boolean',
], [
  '+ handleSearch()',
  '+ renderForecast()',
]);

drawBox(134, 104, 54, 40, 'FarmInsightsView', [
  '- data: FarmAnalyticsData',
  '- loading: boolean',
], [
  '+ renderAreaChart()',
  '+ renderYieldBars()',
]);

drawBox(75, 162, 60, 44, 'ApiService (api.ts)', [
  '+ baseUrl: "/api"',
], [
  '+ fetchCropRecommendation()',
  '+ detectPlantDisease()',
  '+ fetchWeatherData()',
  '+ fetchFarmAnalytics()',
]);

drawBox(75, 222, 60, 38, 'VoiceAssistant', [
  '- isSpeaking: boolean',
  '- isListening: boolean',
  '+ language: Language',
], [
  '+ handleSpeak()',
  '+ handleListen()',
]);

drawArrow(49, 86, 85, 162);
drawArrow(161, 86, 125, 162);
drawArrow(49, 144, 80, 162);
drawArrow(161, 144, 130, 162);
drawArrow(105, 206, 105, 222, true);

// =========================================================================
// PAGE 25 (18 | P a g e): 2.5 Sequence Diagram (A)
// =========================================================================
nextPage(18);
cy = drawSectionHeading('2.5. Sequence Diagram', MARGIN_L, 28, 14);
cy = drawSubHeading('2.5.1. Sequence Diagram (A) — Farmer Auth & Crop Recommendation', MARGIN_L, cy, 11.5);

const seq1X = [36, 82, 128, 174];
const seq1Names = ['Farmer', 'FarmEase UI', 'Express API', 'Gemini AI'];
const seq1Colors = [[216, 180, 254], [254, 240, 138], [186, 230, 253], [253, 186, 116]];

seq1X.forEach((sx, i) => {
  doc.setFillColor(...seq1Colors[i]);
  doc.setDrawColor(60, 60, 60);
  doc.rect(sx - 16, 48, 32, 10, 'FD');
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 15, 15);
  doc.text(seq1Names[i], sx, 54.5, { align: 'center' });
  doc.setLineDashPattern([2, 2], 0);
  doc.line(sx, 58, sx, 256);
  doc.setLineDashPattern([], 0);
});

// Activation bars
doc.setFillColor(210, 215, 220);
doc.rect(80, 66, 4, 48, 'FD');
doc.rect(80, 126, 4, 110, 'FD');
doc.rect(126, 142, 4, 80, 'FD');
doc.rect(172, 154, 4, 40, 'FD');

const seqMsg = (x1, x2, y, lbl, dashed = false) => {
  drawArrow(x1, y, x2, y, dashed);
  doc.setFont('times', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(20, 20, 20);
  doc.text(lbl, (x1 + x2) / 2, y - 2, { align: 'center' });
};

seqMsg(36, 80, 70, '1. Enter Mobile & OTP (8241)');
seqMsg(80, 36, 84, '2. Verify & Save localStorage', true);

// Alt block
doc.setDrawColor(90, 90, 90);
doc.rect(24, 92, 72, 24);
doc.setFont('times', 'bold');
doc.setFontSize(7);
doc.text('alt [New Farmer SignUp]', 26, 97);
seqMsg(36, 80, 104, 'Submit Farm Profile');
seqMsg(80, 36, 112, 'Persist & Open Dashboard', true);

seqMsg(36, 80, 134, '3. Submit Soil, pH, Season, Area');
seqMsg(84, 126, 146, '4. POST /api/crop-recommendation');
seqMsg(130, 172, 158, '5. generateContent(prompt, schema)');
seqMsg(172, 130, 188, '6. Structured JSON Recommendation', true);
seqMsg(126, 84, 210, '7. HTTP 200 { isLiveAi, data }', true);
seqMsg(80, 36, 226, '8. Render Crop Match, Yield & Tips', true);

// =========================================================================
// PAGE 26 (19 | P a g e): 2.5.2 Sequence Diagram (B)
// =========================================================================
nextPage(19);
cy = drawSubHeading('2.5.2. Sequence Diagram (B) — Leaf Pathology Scan & Weather', MARGIN_L, 28, 11.5);

const seq2Names = ['Farmer', 'FarmEase UI', 'Express API', 'Gemini Vision'];
seq1X.forEach((sx, i) => {
  doc.setFillColor(...seq1Colors[i]);
  doc.setDrawColor(60, 60, 60);
  doc.rect(sx - 16, 44, 32, 10, 'FD');
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 15, 15);
  doc.text(seq2Names[i], sx, 50.5, { align: 'center' });
  doc.setLineDashPattern([2, 2], 0);
  doc.line(sx, 54, sx, 256);
  doc.setLineDashPattern([], 0);
});

doc.setFillColor(210, 215, 220);
doc.rect(80, 64, 4, 88, 'FD');
doc.rect(126, 76, 4, 62, 'FD');
doc.rect(172, 88, 4, 34, 'FD');
doc.rect(80, 168, 4, 66, 'FD');
doc.rect(126, 180, 4, 40, 'FD');

seqMsg(36, 80, 68, '1. Upload / Capture Leaf Photo');
seqMsg(84, 126, 80, '2. POST /api/detect-disease (base64)');
seqMsg(130, 172, 92, '3. Analyze Leaf Lesions (Vision)');
seqMsg(172, 130, 116, '4. Return Disease, Confidence & Cure', true);
seqMsg(126, 84, 132, '5. JSON Scan Result', true);
seqMsg(80, 36, 146, '6. Display Pathology Report & Voice', true);

seqMsg(36, 80, 172, '7. Search District Weather');
seqMsg(84, 126, 184, '8. GET /api/weather?location=...');
seqMsg(126, 84, 212, '9. Return 7-Day Forecast & Spray Advice', true);
seqMsg(80, 36, 228, '10. Render Weather & Alert Cards', true);

// =========================================================================
// PAGE 27 (20 | P a g e): CHAPTER 3 - 3.1 Data Design Diagram
// =========================================================================
nextPage(20);
cy = drawChapterHeader(3, 'SYSTEM DESIGN', 28);
cy = drawSectionHeading('3.1. Data Design Diagram', MARGIN_L, cy, 14);

drawBox(75, 58, 60, 42, 'FarmerProfile', [
  'o string id',
  'o string name',
  'o string email',
  'o string phone',
  'o string location',
  'o double farmSize',
  'o string soilType',
  'o string[] mainCrops',
], [], [238, 245, 238]);

drawBox(22, 122, 68, 52, 'CropRecommendation', [
  'o string id',
  'o string cropName',
  'o int suitabilityScore',
  'o string expectedYield',
  'o string growingDuration',
  'o string waterRequirement',
  'o string estimatedProfitability',
  'o string aiExplanation',
  'o string[] keyCareTips',
], [], [238, 245, 238]);

drawBox(118, 122, 70, 52, 'DiseaseScan', [
  'o string id',
  'o string imageUrl',
  'o string cropName',
  'o string diseaseName',
  'o int confidence',
  'o boolean isHealthy',
  'o string[] visibleSymptoms',
  'o string[] recommendedTreatment',
  'o string scannedAt',
], [], [238, 245, 238]);

drawBox(22, 198, 68, 48, 'WeatherData', [
  'o string location',
  'o double currentTemp',
  'o int humidity',
  'o int rainfallProbability',
  'o int windSpeed',
  'o int soilMoisture',
  'o WeatherDayForecast[] forecast',
], [], [238, 245, 238]);

drawBox(118, 198, 70, 48, 'FarmAnalyticsData', [
  'o int farmHealthScore',
  'o int soilHealthIndex',
  'o YieldProjection[] yield',
  'o Trend[] humidityMoistureTrend',
  'o DiseaseRisk[] diseaseRiskMap',
  'o FarmActivity[] recentActivities',
], [], [238, 245, 238]);

drawArrow(85, 100, 56, 122);
drawArrow(125, 100, 152, 122);
drawArrow(56, 174, 56, 198);
drawArrow(152, 174, 152, 198);

// =========================================================================
// PAGE 28 (21 | P a g e): 3.2 Data Flow Diagrams (Level 0 & Level 1)
// =========================================================================
nextPage(21);
cy = drawSectionHeading('3.2. Data Flow Diagrams', MARGIN_L, 28, 14);

// Level 0 container
doc.setFillColor(254, 249, 195);
doc.setDrawColor(80, 80, 80);
doc.roundedRect(20, 42, 170, 86, 10, 10, 'FD');
doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Level 0', 30, 50);

// External Entities & Central System
doc.setFillColor(243, 232, 255);
doc.roundedRect(30, 78, 32, 14, 2, 2, 'FD');
doc.text('Farmer', 46, 86.5, { align: 'center' });

doc.setFillColor(233, 213, 255);
doc.roundedRect(84, 70, 42, 28, 3, 3, 'FD');
doc.text('0', 105, 76, { align: 'center' });
doc.line(84, 79, 126, 79);
doc.text('FarmEase System', 105, 89, { align: 'center' });

doc.setFillColor(243, 232, 255);
doc.roundedRect(148, 78, 32, 14, 2, 2, 'FD');
doc.text('Gemini AI', 164, 86.5, { align: 'center' });

drawArrow(46, 78, 84, 74);
drawArrow(84, 90, 46, 92);
drawArrow(126, 74, 164, 78);
drawArrow(164, 92, 126, 90);
doc.setFont('times', 'normal');
doc.setFontSize(7.5);
doc.text('Login / Soil / Leaf Img', 62, 68, { align: 'center' });
doc.text('Crop Plan & Diagnosis', 62, 102, { align: 'center' });
doc.text('Prompt & Image', 146, 68, { align: 'center' });
doc.text('Structured JSON', 146, 102, { align: 'center' });

// Level 1 container
doc.setFillColor(254, 249, 195);
doc.roundedRect(20, 138, 170, 122, 10, 10, 'FD');
doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Level 1', 30, 146);

doc.setFillColor(248, 113, 113);
doc.rect(40, 152, 26, 10, 'FD');
doc.setFontSize(8.5);
doc.text('Farmer', 53, 158.5, { align: 'center' });

doc.setFillColor(214, 211, 209);
doc.rect(90, 148, 30, 14, 'FD');
doc.text('1.1 Auth', 105, 156.5, { align: 'center' });

doc.setFillColor(45, 212, 191);
doc.rect(144, 152, 28, 10, 'FD');
doc.text('Gemini AI', 158, 158.5, { align: 'center' });

const pBoxes = [
  { x: 26, y: 180, lbl: '1.2 Crop\nAdvisor', fill: [254, 202, 202] },
  { x: 64, y: 180, lbl: '1.3 Disease\nScanner', fill: [254, 202, 202] },
  { x: 108, y: 180, lbl: '1.4 Weather\nService', fill: [187, 247, 208] },
  { x: 148, y: 180, lbl: '1.5 Farm\nInsights', fill: [187, 247, 208] },
];
pBoxes.forEach((b) => {
  doc.setFillColor(...b.fill);
  doc.rect(b.x, b.y, 32, 16, 'FD');
  doc.setFontSize(8);
  doc.text(b.lbl, b.x + 16, b.y + 7, { align: 'center' });
});

doc.setFillColor(251, 146, 60);
doc.rect(82, 224, 46, 12, 'FD');
doc.setFont('times', 'bold');
doc.setFontSize(8);
doc.text('localStorage & API Store', 105, 231.5, { align: 'center' });

drawArrow(66, 157, 90, 157);
drawArrow(120, 157, 144, 157);
drawArrow(42, 162, 42, 180);
drawArrow(53, 162, 80, 180);
drawArrow(42, 196, 82, 228);
drawArrow(80, 196, 95, 224);
drawArrow(124, 196, 115, 224);
drawArrow(164, 196, 128, 228);

// =========================================================================
// PAGE 29 (22 | P a g e): 3.2 Data Flow Diagram Level 2
// =========================================================================
nextPage(22);
doc.setFont('times', 'bold');
doc.setFontSize(11);
doc.text('3.2. Data Flow Diagram (Level 2)', MARGIN_L, 28);

doc.setFillColor(254, 249, 195);
doc.setDrawColor(80, 80, 80);
doc.roundedRect(18, 42, 174, 195, 10, 10, 'FD');
doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Level 2', 28, 52);

doc.setFillColor(248, 113, 113);
doc.rect(36, 60, 26, 10, 'FD');
doc.setFontSize(8);
doc.text('Farmer', 49, 66.5, { align: 'center' });

doc.setFillColor(214, 211, 209);
doc.rect(88, 56, 34, 14, 'FD');
doc.text('2.1 Auth\nOTP / Pass', 105, 62, { align: 'center' });

doc.setFillColor(45, 212, 191);
doc.rect(146, 60, 28, 10, 'FD');
doc.text('Gemini AI', 160, 66.5, { align: 'center' });

const l2Procs = [
  [24, 92, '2.2 Soil & pH\nInput', [254, 202, 202]],
  [24, 134, '2.3 Crop\nPlan Save', [254, 202, 202]],
  [60, 92, '2.4 Leaf\nUpload', [254, 202, 202]],
  [60, 134, '2.5 Scan\nHistory', [254, 202, 202]],
  [124, 92, '2.6 Weather\nLookup', [187, 247, 208]],
  [124, 134, '2.7 Spray\nAlerts', [187, 247, 208]],
  [158, 92, '2.8 Analytics\nCharts', [187, 247, 208]],
  [158, 134, '2.9 Profile\nUpdate', [187, 247, 208]],
];
l2Procs.forEach(([px, py, plbl, pcol]) => {
  doc.setFillColor(...pcol);
  doc.rect(px, py, 28, 16, 'FD');
  doc.setFontSize(7.5);
  doc.text(plbl, px + 14, py + 7, { align: 'center' });
});

doc.setFillColor(251, 146, 60);
doc.rect(86, 178, 38, 12, 'FD');
doc.setTextColor(15, 15, 15);
doc.text('localStorage Store', 105, 185.5, { align: 'center' });
doc.setFillColor(251, 146, 60);
doc.rect(86, 202, 38, 12, 'FD');
doc.setTextColor(15, 15, 15);
doc.text('Express API Proxy', 105, 209.5, { align: 'center' });

drawArrow(62, 65, 88, 65);
drawArrow(122, 65, 146, 65);
drawArrow(40, 70, 38, 92);
drawArrow(49, 70, 74, 92);
drawArrow(38, 108, 38, 134);
drawArrow(74, 108, 74, 134);
drawArrow(138, 108, 138, 134);
drawArrow(172, 108, 172, 134);
drawArrow(38, 150, 86, 184);
drawArrow(74, 150, 86, 206);
drawArrow(138, 150, 124, 206);
drawArrow(172, 150, 124, 184);

// =========================================================================
// PAGE 30 (23 | P a g e): 3.3 Component Diagram (Frontend)
// =========================================================================
nextPage(23);
cy = drawSectionHeading('3.3. Component Diagram (Frontend Layer)', MARGIN_L, 28, 13);

doc.setDrawColor(60, 60, 60);
doc.rect(22, 44, 166, 210);
doc.setFont('times', 'bold');
doc.setFontSize(9);
doc.text('FarmEase Client SPA', 26, 50);

// Layer 1: UI Components
doc.rect(34, 58, 142, 68);
doc.text('Front-End React Components', 38, 64);
const feComps = [
  [40, 72, 'LoginPage\nComponent'],
  [74, 72, 'Dashboard\nComponent'],
  [108, 72, 'CropAdvisor\nComponent'],
  [142, 72, 'DiseaseScan\nComponent'],
  [40, 98, 'WeatherView\nComponent'],
  [74, 98, 'FarmInsights\nComponent'],
  [108, 98, 'ProfileView\nComponent'],
  [142, 98, 'VoiceAssist\nComponent'],
];
feComps.forEach(([x, y, lbl]) => {
  doc.setFillColor(240, 249, 255);
  doc.rect(x, y, 28, 16, 'FD');
  doc.setFontSize(7);
  doc.text(lbl, x + 14, y + 7, { align: 'center' });
});

// Layer 2: Services
doc.rect(34, 142, 142, 42);
doc.setFontSize(9);
doc.text('Client Service & State Layer', 38, 148);
[
  [44, 156, 'api.ts\nFetch Client'],
  [90, 156, 'translations.ts\n6 Languages'],
  [136, 156, 'Hash Router\n& State'],
].forEach(([x, y, lbl]) => {
  doc.setFillColor(236, 253, 245);
  doc.rect(x, y, 32, 18, 'FD');
  doc.setFontSize(7.5);
  doc.text(lbl, x + 16, y + 8, { align: 'center' });
});

// Layer 3: Browser Storage
doc.rect(34, 200, 142, 42);
doc.setFontSize(9);
doc.text('Browser Persistence & Hardware APIs', 38, 206);
[
  [44, 214, 'localStorage\nFarmer Data'],
  [90, 214, 'Web Speech\nAudio & Mic'],
  [136, 214, 'MediaDevices\nCamera API'],
].forEach(([x, y, lbl]) => {
  doc.setFillColor(255, 251, 235);
  doc.rect(x, y, 32, 18, 'FD');
  doc.setFontSize(7.5);
  doc.text(lbl, x + 16, y + 8, { align: 'center' });
});

drawArrow(60, 126, 60, 142);
drawArrow(105, 126, 105, 142);
drawArrow(150, 126, 150, 142);
drawArrow(60, 184, 60, 200);
drawArrow(105, 184, 105, 200);
drawArrow(150, 184, 150, 200);

// =========================================================================
// PAGE 31 (24 | P a g e): 3.3 Component Diagram (Backend & AI)
// =========================================================================
nextPage(24);
cy = drawSectionHeading('3.3. Component Diagram (Backend & AI Layer)', MARGIN_L, 28, 13);

doc.setDrawColor(60, 60, 60);
doc.rect(22, 44, 166, 210);
doc.setFont('times', 'bold');
doc.setFontSize(9);
doc.text('FarmEase Server & AI Architecture', 26, 50);

doc.rect(34, 58, 142, 52);
doc.text('Express.js REST API Endpoints (server.ts)', 38, 64);
[
  [40, 74, 'POST /api/\ncrop-rec'],
  [74, 74, 'POST /api/\ndisease'],
  [108, 74, 'GET /api/\nweather'],
  [142, 74, 'GET /api/\nanalytics'],
].forEach(([x, y, lbl]) => {
  doc.setFillColor(238, 242, 255);
  doc.rect(x, y, 28, 20, 'FD');
  doc.setFontSize(7.5);
  doc.text(lbl, x + 14, y + 8.5, { align: 'center' });
});

doc.rect(34, 128, 142, 48);
doc.setFontSize(9);
doc.text('AI & Agronomic Processing Layer', 38, 134);
[
  [44, 144, '@google/genai\nGemini Client'],
  [90, 144, 'JSON Schema\nValidator'],
  [136, 144, 'Algorithmic\nFallbacks'],
].forEach(([x, y, lbl]) => {
  doc.setFillColor(236, 253, 245);
  doc.rect(x, y, 32, 20, 'FD');
  doc.setFontSize(7.5);
  doc.text(lbl, x + 16, y + 8.5, { align: 'center' });
});

doc.rect(34, 194, 142, 46);
doc.setFontSize(9);
doc.text('External Cloud & Static Serving', 38, 200);
[
  [48, 208, 'Gemini Flash\nVision & Text'],
  [116, 208, 'Vite Middleware\n/ dist Static'],
].forEach(([x, y, lbl]) => {
  doc.setFillColor(254, 243, 199);
  doc.rect(x, y, 44, 20, 'FD');
  doc.setFontSize(7.5);
  doc.text(lbl, x + 22, y + 8.5, { align: 'center' });
});

drawArrow(60, 110, 60, 128);
drawArrow(105, 110, 105, 128);
drawArrow(150, 110, 150, 128);
drawArrow(70, 176, 70, 194);
drawArrow(138, 176, 138, 194);

// =========================================================================
// PAGE 32 (25 | P a g e): 3.4 Package Diagram (Frontend)
// =========================================================================
nextPage(25);
cy = drawSectionHeading('3.4. Package Diagram (Frontend Application)', MARGIN_L, 28, 13);

const drawPkg = (x, y, w, h, tabLbl, title, fillRgb) => {
  doc.setFillColor(...fillRgb);
  doc.setDrawColor(50, 50, 50);
  doc.rect(x, y - 5, 22, 5, 'FD');
  doc.rect(x, y, w, h, 'FD');
  doc.setFont('times', 'bold');
  doc.setFontSize(7);
  doc.text(tabLbl, x + 2, y - 1.5);
  doc.setFontSize(8);
  doc.text(title, x + w / 2, y + h / 2 + 1, { align: 'center' });
};

doc.setDrawColor(60, 60, 60);
doc.rect(22, 44, 166, 210);
doc.setFont('times', 'bold');
doc.setFontSize(9);
doc.text('FarmEase Web UI', 26, 50);

drawPkg(62, 62, 86, 42, 'Application Layer', '', [254, 215, 170]);
drawPkg(70, 74, 30, 22, 'Package', 'User\nInterface', [255, 255, 255]);
drawPkg(110, 74, 30, 22, 'Package', 'REST\nClient', [255, 255, 255]);

drawPkg(32, 126, 146, 44, 'Business Layer', '', [229, 229, 210]);
drawPkg(38, 140, 28, 22, 'Package', 'Auth &\nProfile', [255, 255, 255]);
drawPkg(72, 140, 28, 22, 'Package', 'Crop\nAdvisor', [255, 255, 255]);
drawPkg(106, 140, 28, 22, 'Package', 'Disease\nScanner', [255, 255, 255]);
drawPkg(140, 140, 28, 22, 'Package', 'Weather &\nInsights', [255, 255, 255]);

drawPkg(44, 194, 122, 44, 'Data Layer', '', [187, 247, 208]);
drawPkg(52, 208, 32, 22, 'Package', 'localStorage\nStore', [255, 255, 255]);
drawPkg(90, 208, 32, 22, 'Package', 'Translations\n(6 Langs)', [255, 255, 255]);
drawPkg(128, 208, 32, 22, 'Package', 'Types &\nSchemas', [255, 255, 255]);

drawArrow(85, 104, 52, 126);
drawArrow(105, 104, 86, 126);
drawArrow(125, 104, 120, 126);
drawArrow(52, 170, 68, 194);
drawArrow(105, 170, 106, 194);
drawArrow(154, 170, 144, 194);

// =========================================================================
// PAGE 33 (26 | P a g e): 3.4 Package Diagram (Backend & AI)
// =========================================================================
nextPage(26);
cy = drawSectionHeading('3.4. Package Diagram (Backend & AI Services)', MARGIN_L, 28, 13);

doc.setDrawColor(60, 60, 60);
doc.rect(22, 44, 166, 210);
doc.setFont('times', 'bold');
doc.setFontSize(9);
doc.text('FarmEase Server', 26, 50);

drawPkg(62, 62, 86, 42, 'API Gateway Layer', '', [191, 219, 254]);
drawPkg(70, 74, 30, 22, 'Package', 'Express\nRoutes', [255, 255, 255]);
drawPkg(110, 74, 30, 22, 'Package', 'Vite / Static\nServer', [255, 255, 255]);

drawPkg(32, 126, 146, 44, 'AI & Domain Layer', '', [209, 250, 229]);
drawPkg(40, 140, 38, 22, 'Package', 'Gemini Crop\nEngine', [255, 255, 255]);
drawPkg(86, 140, 38, 22, 'Package', 'Gemini Vision\nPathology', [255, 255, 255]);
drawPkg(132, 140, 38, 22, 'Package', 'Weather &\nAnalytics', [255, 255, 255]);

drawPkg(44, 194, 122, 44, 'External & Config Layer', '', [254, 205, 211]);
drawPkg(54, 208, 44, 22, 'Package', '@google/genai\nCloud SDK', [255, 255, 255]);
drawPkg(112, 208, 44, 22, 'Package', 'dotenv &\nFallback Data', [255, 255, 255]);

drawArrow(85, 104, 59, 126);
drawArrow(105, 104, 105, 126);
drawArrow(125, 104, 151, 126);
drawArrow(59, 170, 76, 194);
drawArrow(105, 170, 76, 194);
drawArrow(151, 170, 134, 194);

// =========================================================================
// PAGE 34 (27 | P a g e): 3.5 Deployment Diagram
// =========================================================================
nextPage(27);
cy = drawSectionHeading('3.5. Deployment Diagram', MARGIN_L, 28, 14);

const drawNode = (x, y, w, h, title, compTitle) => {
  doc.setDrawColor(30, 30, 30);
  doc.setFillColor(245, 248, 250);
  doc.rect(x, y, w, h, 'FD');
  // 3D top & right bevel
  doc.line(x, y, x + 4, y - 4);
  doc.line(x + 4, y - 4, x + w + 4, y - 4);
  doc.line(x + w + 4, y - 4, x + w, y);
  doc.line(x + w + 4, y - 4, x + w + 4, y + h - 4);
  doc.line(x + w + 4, y + h - 4, x + w, y + h);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text(title, x + w / 2, y + 6, { align: 'center' });
  if (compTitle) {
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 8, y + 11, w - 16, h - 16, 'FD');
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text(compTitle, x + w / 2, y + 11 + (h - 16) / 2 + 1.5, { align: 'center' });
  }
};

drawNode(34, 52, 54, 30, 'Farmer Mobile Device', 'Mobile Browser / Camera');
drawNode(122, 52, 54, 30, 'Farmer Desktop PC', 'React 19 Web Client');
drawNode(72, 114, 66, 32, 'Node.js / Express Server', 'server.ts (Port 3000) & Vite');
drawNode(28, 178, 66, 30, 'Google Gemini Cloud', 'Multimodal Vision & Text AI');
drawNode(116, 178, 66, 30, 'GitHub Pages / Client', 'Static dist/ & localStorage');

drawArrow(61, 82, 92, 114);
drawArrow(149, 82, 118, 114);
drawArrow(92, 146, 61, 178);
drawArrow(118, 146, 149, 178);

doc.setFont('times', 'italic');
doc.setFontSize(8);
doc.text('HTTPS / JSON', 62, 100);
doc.text('HTTPS / JSON', 138, 100);
doc.text('Gemini API Key Proxy', 50, 164);
doc.text('Static Bundle & Sync', 135, 164);

// =========================================================================
// PAGE 35 (28 | P a g e): CHAPTER 4 - 4.1.1 Navigation Tree (A)
// =========================================================================
nextPage(28);
cy = drawChapterHeader(4, 'SYSTEM CODING', 28);
cy = drawSectionHeading('4.1. Navigation Tree', MARGIN_L, cy, 14);
cy = drawSubHeading('4.1.1. Navigation Tree (A) — Farmer Auth & Core Portal', MARGIN_L, cy, 11.5);

const navNode = (cx, cyb, lbl, fill = [235, 240, 235]) => {
  doc.setFillColor(...fill);
  doc.setDrawColor(50, 50, 50);
  doc.roundedRect(cx - 17, cyb - 5, 34, 10, 2, 2, 'FD');
  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 15, 15);
  doc.text(lbl, cx, cyb + 1.5, { align: 'center' });
};

navNode(105, 78, 'Home Hero Page', [236, 253, 245]);
drawArrow(105, 83, 105, 92);
actDiamond(105, 99, 'Logged In?');
drawArrow(117, 99, 142, 99);
navNode(159, 99, 'Login Portal', [254, 243, 199]);
drawArrow(105, 106, 105, 122);
drawArrow(159, 104, 159, 114);
drawArrow(159, 114, 105, 114);

navNode(105, 128, 'Dashboard View', [209, 250, 229]);
drawArrow(105, 133, 45, 156);
drawArrow(105, 133, 105, 156);
drawArrow(105, 133, 165, 156);

navNode(45, 162, 'Crop Advisor', [240, 253, 244]);
navNode(105, 162, 'Disease Doctor', [240, 253, 244]);
navNode(165, 162, 'Profile View', [240, 253, 244]);

drawArrow(45, 167, 45, 188);
drawArrow(105, 167, 105, 188);
drawArrow(165, 167, 165, 222);

navNode(45, 194, 'Save Crop Plan');
navNode(105, 194, 'Save Leaf Scan');

doc.setDrawColor(15, 15, 15);
doc.circle(165, 228, 4.5);
doc.setFillColor(15, 15, 15);
doc.circle(165, 228, 2.5, 'F');
doc.setFontSize(8);
doc.text('Logout', 152, 229.5);

// =========================================================================
// PAGE 36 (29 | P a g e): 4.1.2 Navigation Tree (B)
// =========================================================================
nextPage(29);
cy = drawSubHeading('4.1.2. Navigation Tree (B) — AI Diagnostics, Weather & Insights', MARGIN_L, 28, 11.5);

navNode(105, 52, 'Top Navbar / Drawer', [236, 253, 245]);
drawArrow(105, 57, 36, 82);
drawArrow(105, 57, 72, 82);
drawArrow(105, 57, 108, 82);
drawArrow(105, 57, 144, 82);
drawArrow(105, 57, 174, 82);

navNode(36, 88, 'Home');
navNode(72, 88, 'Crop AI');
navNode(108, 88, 'Disease AI');
navNode(144, 88, 'Weather');
navNode(174, 88, 'Insights');

drawArrow(72, 93, 72, 118);
drawArrow(108, 93, 108, 118);
drawArrow(144, 93, 144, 118);
drawArrow(174, 93, 174, 118);

navNode(72, 124, 'Soil & pH Form');
navNode(108, 124, 'Upload / Camera');
navNode(144, 124, 'Search District');
navNode(174, 124, 'Moisture Charts');

drawArrow(72, 129, 72, 154);
drawArrow(108, 129, 108, 154);
drawArrow(144, 129, 144, 154);

navNode(72, 160, 'Yield & Profit');
navNode(108, 160, 'Cure & Tips');
navNode(144, 160, '7-Day Forecast');

drawArrow(72, 165, 105, 192);
drawArrow(108, 165, 105, 192);
drawArrow(144, 165, 105, 192);

navNode(105, 198, 'Voice Read Aloud', [254, 243, 199]);

// =========================================================================
// PAGES 37–63 (30 | P a g e to 56 | P a g e): 4.2 Program Description (27 Pages of Real FarmEase Code)
// =========================================================================
const codeModules = [
  { heading: '4.2.1. Core Type Definitions & API Client', title: '1. src/types/index.ts', file: 'src/types/index.ts', maxLines: 135 },
  { heading: null, title: '2. src/services/api.ts', file: 'src/services/api.ts', maxLines: 165 },
  { heading: null, title: '3. src/App.tsx', file: 'src/App.tsx', maxLines: 175 },
  { heading: '4.2.2. Authentication & Farmer Dashboard Components', title: '4. src/components/LoginPage.tsx', file: 'src/components/LoginPage.tsx', maxLines: 185 },
  { heading: null, title: '5. src/components/Dashboard.tsx', file: 'src/components/Dashboard.tsx', maxLines: 145 },
  { heading: null, title: '6. src/components/CropRecommendationView.tsx', file: 'src/components/CropRecommendationView.tsx', maxLines: 155 },
  { heading: null, title: '7. src/components/DiseaseDetectionView.tsx', file: 'src/components/DiseaseDetectionView.tsx', maxLines: 155 },
  { heading: null, title: '8. src/components/WeatherView.tsx', file: 'src/components/WeatherView.tsx', maxLines: 145 },
  { heading: null, title: '9. src/components/FarmInsightsView.tsx', file: 'src/components/FarmInsightsView.tsx', maxLines: 145 },
  { heading: null, title: '10. src/components/ProfileView.tsx', file: 'src/components/ProfileView.tsx', maxLines: 145 },
  { heading: '4.2.3. Backend Express & Gemini AI Server', title: '11. server.ts', file: 'server.ts', maxLines: 290 },
];

// Build exact stream of formatted lines across Pages 37..63 (printed pages 30..56)
const codeLinesStream = [];
codeModules.forEach((mod, mIdx) => {
  if (mIdx === 0) {
    codeLinesStream.push({ type: 'h1', text: '4.2. Program Description' });
  }
  if (mod.heading) {
    codeLinesStream.push({ type: 'h2', text: mod.heading });
  }
  codeLinesStream.push({ type: 'h3', text: mod.title });
  const raw = fs.readFileSync(path.resolve(mod.file), 'utf8').split('\n');
  let addedForFile = 0;
  let lastWasBlank = false;
  for (let rIdx = 0; rIdx < raw.length; rIdx++) {
    const clean = sanitizePdfText(raw[rIdx].replace(/\t/g, '  '));
    if (clean.trim().length === 0) {
      if (lastWasBlank) continue;
      lastWasBlank = true;
      codeLinesStream.push({ type: 'code', text: '' });
      addedForFile++;
    } else {
      lastWasBlank = false;
      // Condense base64 image literals cleanly
      const compact = clean.includes('data:image/') ? clean.slice(0, 68) + '... [base64 image]' : clean;
      for (let i = 0; i < compact.length; i += 86) {
        codeLinesStream.push({ type: 'code', text: compact.slice(i, i + 86) });
        addedForFile++;
      }
    }
    if (addedForFile >= mod.maxLines && rIdx < raw.length - 1) {
      codeLinesStream.push({ type: 'code', text: `// ... (${raw.length - rIdx - 1} additional UI markup lines in ${mod.file})` });
      break;
    }
  }
  codeLinesStream.push({ type: 'code', text: '' });
});

// Distribute code lines across EXACTLY 27 pages (Pages 37..63 => 30..56)
let streamIdx = 0;
for (let p = 30; p <= 56; p++) {
  nextPage(p);
  let y = 25;
  const yLimit = PAGE_H - 25;
  while (streamIdx < codeLinesStream.length && y < yLimit) {
    const item = codeLinesStream[streamIdx];
    if (item.type === 'h1') {
      if (y + 12 > yLimit) break;
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 15, 15);
      doc.text(item.text, MARGIN_L, y);
      y += 8.5;
    } else if (item.type === 'h2') {
      if (y + 10 > yLimit) break;
      doc.setFont('times', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(15, 15, 15);
      doc.text(item.text, MARGIN_L, y);
      y += 6.5;
    } else if (item.type === 'h3') {
      if (y + 9 > yLimit) break;
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(6, 78, 59);
      doc.text(item.text, MARGIN_L + 2, y);
      y += 5.5;
    } else {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.4);
      const trimmed = item.text.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        doc.setTextColor(100, 116, 139);
      } else if (/^(import|export|const|let|async|function|interface|type|return|if|else|try|catch)\b/.test(trimmed)) {
        doc.setTextColor(30, 58, 138);
      } else {
        doc.setTextColor(25, 25, 25);
      }
      doc.text(item.text, MARGIN_L + 3, y);
      y += 3.55;
    }
    streamIdx++;
  }
}
console.log(`Code stream rendered ${streamIdx}/${codeLinesStream.length} lines across pages 30-56.`);

// =========================================================================
// PAGE 64 (57 | P a g e): 4.3 Validations (9-Row Table)
// =========================================================================
nextPage(57);
cy = drawSectionHeading('4.3. Validations', MARGIN_L, 28, 14);
cy = drawStyledTable(
  ['Validation Type', 'Description', 'Validation Logic'],
  [
    ['Authentication Validation', 'Validates format of email/phone and password length.', '- Mobile number must be >= 10 digits.\n- Password must be at least 6 characters.'],
    ['OTP Code Validation', 'Ensures 4-digit OTP code is entered before verification.', '- OTP code cannot be empty and must be 4 numeric digits.'],
    ['Sign-Up Input Validation', 'Ensures farmer name, phone, and plot size follow rules.', '- Full name required.\n- Farm plot size must be > 0.'],
    ['Soil & pH Range Validation', 'Ensures crop recommendation inputs stay within agronomic bounds.', '- Soil pH constrained between 4.5 and 9.0.\n- Temperature between 5°C and 50°C.'],
    ['Upload Image Validation', 'Ensures uploaded leaf images are valid image files under size limit.', '- File MIME must start with image/*.\n- Server JSON payload <= 25MB.'],
    ['Session Persistence Checks', 'Prevents loss of registered farmer profiles on browser refresh.', '- Synchronizes farmease_user and farmease_registered_farmers in localStorage.'],
    ['URL Hash Routing Checks', 'Validates deep-link hashes for GitHub Pages navigation.', '- Maps #signup, #login, #dashboard, #weather to valid view tabs.'],
    ['API Security Validation', 'Ensures Gemini API key never leaks to client browsers.', '- API key isolated in server.ts environment variables only.'],
    ['Offline Fallback Validation', 'Guarantees advisory output even if Gemini API is offline.', '- Automatic fallback recommendations & scans returned on HTTP failure.'],
  ],
  [44, 56, 66],
  MARGIN_L,
  cy,
  [217, 234, 211],
  9.2
);

// =========================================================================
// PAGE 65 (58 | P a g e): 4.4 Test Cases (9-Row Table)
// =========================================================================
nextPage(58);
cy = drawSectionHeading('4.4. Test Cases', MARGIN_L, 28, 14);
cy = drawStyledTable(
  ['Test Case ID', 'Test Scenario', 'Test Description', 'Expected Result'],
  [
    ['1', 'Farmer Authentication - Invalid Phone', 'Attempt OTP request with phone < 10 digits.', 'Error message "Please enter a valid 10-digit mobile number."'],
    ['2', 'Farmer Login - Empty Password', 'Try signing in with an empty password field.', 'Error message "Please provide both your login email/phone and password."'],
    ['3', 'New Farmer Sign Up - Success', 'Register farmer with name, phone, password >= 6 chars, plot size.', 'Account saved in localStorage and redirected to Dashboard.'],
    ['4', 'AI Crop Recommendation - Success', 'Submit Loamy soil, pH 6.5, Kharif season, 5 acres.', 'Returns crop match, suitability %, expected yield & care tips.'],
    ['5', 'Disease Scanner - Invalid File', 'Attempt to upload a non-image document (.txt/.pdf).', 'Alert "Please select a valid leaf or plant image file."'],
    ['6', 'Disease Scanner - Sample Leaf', 'Click Tomato Blight preset sample image.', 'Displays Tomato Early Blight (94% confidence) & treatment steps.'],
    ['7', 'Weather District Search', 'Search "Nashik, Maharashtra" in Weather Intelligence.', 'Updates location cards, 7-day forecast & spray advisory.'],
    ['8', 'Multilingual Language Switch', 'Change language dropdown from English to Hindi or Marathi.', 'All navigation & module headings update dynamically.'],
    ['9', 'URL Hash Deep Link (#signup)', 'Open /#signup directly in browser and reload page.', 'Opens New Farmer registration tab and preserves stored user.'],
  ],
  [22, 42, 48, 54],
  MARGIN_L,
  cy,
  [244, 204, 204],
  9.2
);

// =========================================================================
// PAGE 66 (59 | P a g e): 4.5 Test Data and Test Results (4.5.1 & 4.5.2)
// =========================================================================
nextPage(59);
cy = drawSectionHeading('4.5. Test Data and Test Results', MARGIN_L, 28, 14);
cy = drawSubHeading('4.5.1. User Authentication', MARGIN_L, cy, 11.5);
doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Test Data:', MARGIN_L, cy);
cy += 4;
cy = drawStyledTable(
  ['Test Case ID', 'Input', 'Expected Output'],
  [
    ['1', 'Phone: 9876, OTP: (not sent)', 'Error message "Please enter a valid 10-digit mobile number." should be displayed.'],
    ['2', 'Email: yash.shidruk@farmease.app, Password: (empty)', 'Error message "Please provide both your login email/phone and password." should be displayed.'],
  ],
  [28, 66, 72],
  MARGIN_L,
  cy,
  [180, 198, 231],
  9.2
);

doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Test Results:', MARGIN_L, cy);
cy += 4;
cy = drawStyledTable(
  ['Test Case ID', 'Actual Result', 'Pass/Fail'],
  [
    ['1', 'Error message "Please enter a valid 10-digit mobile number." is displayed.', 'Pass'],
    ['2', 'Error message "Please provide both your login email/phone and password." is displayed.', 'Pass'],
  ],
  [28, 110, 28],
  MARGIN_L,
  cy,
  [198, 224, 180],
  9.2
);

cy = drawSubHeading('4.5.2. New Farmer Sign Up', MARGIN_L, cy + 2, 11.5);
doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Test Data:', MARGIN_L, cy);
cy += 4;
cy = drawStyledTable(
  ['Test Case ID', 'Input', 'Expected Output'],
  [
    ['3', 'Name: Ramesh Patil, Phone: +91 9822011223, Password: farmease2026', 'Farmer account created, saved to localStorage, and Dashboard opened.'],
  ],
  [28, 66, 72],
  MARGIN_L,
  cy,
  [180, 198, 231],
  9.2
);

// =========================================================================
// PAGE 67 (60 | P a g e): 4.5.2 contd & 4.5.3
// =========================================================================
nextPage(60);
cy = 30;
cy = drawStyledTable(
  ['Test Case ID', 'Input', 'Expected Output'],
  [
    ['4', 'Name: (empty), Phone: +91 9822011223', 'Error message "Please enter your full name." displayed.'],
    ['5', 'Name: Sunita, Password: 123 (< 6 chars)', 'Error message "Password must be at least 6 characters." displayed.'],
    ['6', '1-Click Demo Profile: Yash Shidruk', 'Instant authentication into Yash Shidruk profile & Dashboard.'],
  ],
  [28, 66, 72],
  MARGIN_L,
  cy,
  [180, 198, 231],
  9.2
);

doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Test Results:', MARGIN_L, cy);
cy += 4;
cy = drawStyledTable(
  ['Test Case ID', 'Actual Result', 'Pass/Fail'],
  [
    ['3', 'Farmer account created, stored in localStorage, and redirected to Dashboard.', 'Pass'],
    ['4', 'Error message "Please enter your full name." is displayed.', 'Pass'],
    ['5', 'Error message "Password must be at least 6 characters." is displayed.', 'Pass'],
    ['6', 'Instant sign-in completed for Yash Shidruk.', 'Pass'],
  ],
  [28, 110, 28],
  MARGIN_L,
  cy,
  [198, 224, 180],
  9.2
);

cy = drawSubHeading('4.5.3. AI Crop Recommendation Engine', MARGIN_L, cy + 2, 11.5);
doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Test Data:', MARGIN_L, cy);
cy += 4;
cy = drawStyledTable(
  ['Test Case ID', 'Input', 'Expected Output'],
  [
    ['7', 'Location: Mumbai, Soil: Loamy, pH: 6.5, Season: Kharif, Size: 5 Acres', 'Recommends Maize / Basmati Rice with 94-95% suitability score.'],
  ],
  [28, 66, 72],
  MARGIN_L,
  cy,
  [180, 198, 231],
  9.2
);

// =========================================================================
// PAGE 68 (61 | P a g e): 4.5.3 contd & 4.5.4
// =========================================================================
nextPage(61);
cy = 30;
cy = drawStyledTable(
  ['Test Case ID', 'Input', 'Expected Output'],
  [
    ['8', 'Soil: Sandy, Water: Low, Season: Zaid', 'Recommends Millets (Bajra) & Sesame with Low water tag.'],
  ],
  [28, 66, 72],
  MARGIN_L,
  cy,
  [180, 198, 231],
  9.2
);

doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Test Results:', MARGIN_L, cy);
cy += 4;
cy = drawStyledTable(
  ['Test Case ID', 'Actual Result', 'Pass/Fail'],
  [
    ['7', 'Recommendation card rendered with yield, profit & 3 care tips.', 'Pass'],
    ['8', 'Millets & Sesame recommended with Low water requirement.', 'Pass'],
  ],
  [28, 110, 28],
  MARGIN_L,
  cy,
  [198, 224, 180],
  9.2
);

cy = drawSubHeading('4.5.4. AI Disease Detection & Weather Advisory', MARGIN_L, cy + 4, 11.5);
doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Test Data:', MARGIN_L, cy);
cy += 4;
cy = drawStyledTable(
  ['Test Case ID', 'Input', 'Expected Output'],
  [
    ['9', 'Sample Image: Tomato Blight Leaf, Crop: Tomato', 'Detects Tomato Early Blight (94% confidence) & Copper fungicide cure.'],
    ['10', 'Weather Search: "Nashik, Maharashtra"', 'Displays 29°C, 68% humidity, 7-day forecast & spraying guidance.'],
  ],
  [28, 66, 72],
  MARGIN_L,
  cy,
  [180, 198, 231],
  9.2
);

doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Test Results:', MARGIN_L, cy);
cy += 4;
cy = drawStyledTable(
  ['Test Case ID', 'Actual Result', 'Pass/Fail'],
  [
    ['9', 'Tomato Early Blight diagnosed with symptoms, treatment & prevention tips.', 'Pass'],
    ['10', 'Weather intelligence & 7-day agricultural advisories updated.', 'Pass'],
  ],
  [28, 110, 28],
  MARGIN_L,
  cy,
  [198, 224, 180],
  9.2
);

// =========================================================================
// PAGE 69 (62 | P a g e): 4.5.5 Summary of Test Results
// =========================================================================
nextPage(62);
cy = drawSubHeading('4.5.5. Summary of Test Results', MARGIN_L, 28, 12.5);
cy = drawStyledTable(
  ['Test Cases', 'Total Test Cases', 'Pass', 'Fail'],
  [
    ['User Authentication (OTP & Password)', '2', '2', '0'],
    ['New Farmer Sign Up & Demo Profiles', '4', '4', '0'],
    ['AI Crop Recommendation Engine', '2', '2', '0'],
    ['AI Plant Disease Detection Scanner', '2', '2', '0'],
    ['Weather Intelligence & Hash Routing', '2', '2', '0'],
    ['Total', '12', '12', '0'],
  ],
  [66, 40, 30, 30],
  MARGIN_L,
  cy + 4,
  [254, 230, 153],
  10
);

// =========================================================================
// PAGES 70–76 (63 | P a g e to 69 | P a g e): CHAPTER 5 - SCREEN LAYOUTS
// =========================================================================
function drawScreenMockupFrame(x, y, w, h, titleBar, headerBg, bodyLines) {
  // Browser/Mobile frame
  doc.setDrawColor(30, 60, 45);
  doc.setLineWidth(0.7);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, w, h, 4, 4, 'FD');

  // Header bar
  doc.setFillColor(...headerBg);
  doc.roundedRect(x, y, w, 12, 4, 4, 'F');
  doc.rect(x, y + 8, w, 4, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(sanitizePdfText(titleBar), x + 4, y + 7.5);

  // Body UI cards
  let by = y + 17;
  bodyLines.forEach((blk) => {
    doc.setFillColor(...blk.bg);
    doc.setDrawColor(200, 210, 205);
    doc.setLineWidth(0.25);
    doc.roundedRect(x + 4, by, w - 8, blk.h, 2, 2, 'FD');
    doc.setFont('times', blk.bold ? 'bold' : 'normal');
    doc.setFontSize(blk.size || 7.5);
    doc.setTextColor(...(blk.fg || [20, 20, 20]));
    const ls = doc.splitTextToSize(sanitizePdfText(blk.text), w - 13);
    ls.forEach((l, li) => {
      if (by + 4.5 + li * 3.8 < by + blk.h - 1) {
        doc.text(l, x + 6.5, by + 4.5 + li * 3.8);
      }
    });
    by += blk.h + 3;
  });
}

// Page 70 (63 | P a g e): 5.1 & 5.2
nextPage(63);
cy = drawChapterHeader(5, 'SCREEN LAYOUTS & REPORT LAYOUTS', 26);
cy = drawSubHeading('5.1. Home Hero & Farmer Login Page', MARGIN_L, cy - 2, 11);
drawScreenMockupFrame(26, cy, 74, 82, 'FarmEase • Home Hero', [6, 78, 59], [
  { bg: [6, 95, 70], fg: [255, 255, 255], h: 24, bold: true, text: 'Smart Farming. Better Yields.\nAI Crop Doctor • 6 Languages • 24/7 Weather' },
  { bg: [251, 191, 36], fg: [20, 20, 20], h: 10, bold: true, text: 'Start Farming Smarter  |  Farmer Sign Up' },
  { bg: [236, 253, 245], fg: [6, 78, 59], h: 22, text: 'Live Card: Tomato Early Blight (94%)\n29°C • 35% Rain • Best: Basmati Rice' },
]);
drawScreenMockupFrame(110, cy, 74, 82, 'FarmEase • Farmer Login', [6, 78, 59], [
  { bg: [236, 253, 245], fg: [6, 78, 59], h: 12, bold: true, text: 'Tabs: [Mobile OTP] [Password] [New Farmer]' },
  { bg: [255, 255, 255], h: 24, text: 'Registered Mobile: +91 98765 43210\nEnter 4-Digit OTP: [ 8 2 4 1 ]\nDemo Code: 8241 (Auto-Fill)' },
  { bg: [16, 185, 129], fg: [255, 255, 255], h: 10, bold: true, text: 'Verify & Enter Farm Dashboard' },
  { bg: [245, 245, 244], h: 11, text: 'Quick Demo: Yash Shidruk | Ramesh | Sunita' },
]);

cy += 90;
cy = drawSubHeading('5.2. New Farmer Sign-Up Page & Farmer Dashboard', MARGIN_L, cy, 11);
drawScreenMockupFrame(26, cy, 74, 82, 'FarmEase • New Registration', [6, 78, 59], [
  { bg: [255, 255, 255], h: 48, text: 'Full Name: Yash Shidruk\nMobile: +91 98765 43210\nLocation: Mumbai, Maharashtra\nPlot Size: 5.0 Acres | Soil: Loamy Alluvial\nMain Crops: Rice, Wheat, Maize' },
  { bg: [5, 150, 105], fg: [255, 255, 255], h: 11, bold: true, text: 'Complete Registration & Launch Farm' },
]);
drawScreenMockupFrame(110, cy, 74, 82, 'FarmEase • Farmer Dashboard', [6, 95, 70], [
  { bg: [20, 83, 45], fg: [255, 255, 255], h: 20, bold: true, text: 'Good Morning, Yash Shidruk!\nFarm Health Score: 88% (Excellent)' },
  { bg: [240, 253, 244], h: 16, text: 'Quick Actions: Recommend Crop | Scan Leaf | Weather | Farm Insights' },
  { bg: [255, 251, 235], h: 20, text: 'Weather: 29°C • Humidity 68% • 35% Rain\nRecent Scan: Tomato Early Blight (94%)' },
]);

// Page 71 (64 | P a g e): 5.3 & 5.4
nextPage(64);
cy = drawSubHeading('5.3. AI Crop Recommendation Input & Output Section', MARGIN_L, 28, 11);
drawScreenMockupFrame(26, cy, 74, 88, 'AI Agronomy • Input Form', [6, 95, 70], [
  { bg: [255, 255, 255], h: 52, text: 'Location: Mumbai, Maharashtra | Size: 5 Acres\nSoil Type: Loamy Soil | Soil pH: 6.5\nWater: Medium (Canal / Rainfed)\nTemperature: 28°C | Season: Kharif\nPrevious Crop: Wheat' },
  { bg: [5, 150, 105], fg: [255, 255, 255], h: 11, bold: true, text: 'Get AI Crop Recommendation' },
]);
drawScreenMockupFrame(110, cy, 74, 88, 'AI Agronomy • Match Result', [6, 95, 70], [
  { bg: [236, 253, 245], fg: [6, 78, 59], h: 18, bold: true, text: 'Recommended: Basmati Rice (PBR 1121)\nSuitability Index: 94% Match' },
  { bg: [255, 255, 255], h: 30, text: 'Expected Yield: 4.8 tons/ha | 120-135 days\nWater: High | Profit: $2,100/hectare\nCare: Maintain 2-3cm standing water.' },
  { bg: [6, 78, 59], fg: [255, 255, 255], h: 10, bold: true, text: 'Listen Aloud  |  Save Recommendation' },
]);

cy += 98;
cy = drawSubHeading('5.4. AI Plant Disease Scanner & Diagnosis Report', MARGIN_L, cy, 11);
drawScreenMockupFrame(26, cy, 74, 88, 'AI Vision • Leaf Scanner', [146, 64, 14], [
  { bg: [255, 251, 235], h: 14, text: 'Crop Type Context: [ Tomato v ]' },
  { bg: [255, 255, 255], h: 34, text: '[ Drag & Drop Leaf Photo / Click to Upload ]\nOr Snap Photo via Device Camera\nSamples: Tomato | Corn | Healthy Rice' },
  { bg: [217, 119, 6], fg: [255, 255, 255], h: 10, bold: true, text: 'Analyzing Leaf Lesions...' },
]);
drawScreenMockupFrame(110, cy, 74, 88, 'Pathology Report • 94%', [146, 64, 14], [
  { bg: [254, 226, 226], fg: [153, 27, 27], h: 16, bold: true, text: 'Diseased Plant • 94% Confidence\nTomato Early Blight (Alternaria solani)' },
  { bg: [255, 255, 255], h: 28, text: 'Symptoms: Concentric brown spots, yellow halo\nTreatment: Remove infected leaves, spray Copper Hydroxide fungicide.' },
  { bg: [240, 249, 255], h: 12, text: 'Prevention: 3-year rotation & mulch soil base.' },
]);

// Page 72 (65 | P a g e): 5.5 & 5.6
nextPage(65);
cy = drawSubHeading('5.5. Disease Sample Presets & Farmer Profile Page', MARGIN_L, 28, 11);
drawScreenMockupFrame(26, cy, 74, 88, 'Sample Leaf Presets', [146, 64, 14], [
  { bg: [255, 255, 255], h: 20, bold: true, text: '1. Tomato Blight Sample (Alternaria solani)' },
  { bg: [255, 255, 255], h: 20, bold: true, text: '2. Corn Rust Sample (Puccinia sorghi)' },
  { bg: [236, 253, 245], h: 20, bold: true, text: '3. Healthy Rice Leaf Sample (97% Healthy)' },
]);
drawScreenMockupFrame(110, cy, 74, 88, 'Farmer Profile • Yash Shidruk', [6, 78, 59], [
  { bg: [255, 255, 255], h: 48, text: 'Name: Yash Shidruk\nLocation: Mumbai, Maharashtra\nFarm Size: 5.0 Acres | Soil: Loamy Alluvial\nCrops: Rice (Paddy), Wheat, Maize\nEmail: yash.shidruk@farmease.app' },
  { bg: [6, 95, 70], fg: [255, 255, 255], h: 10, bold: true, text: 'Update Farm Profile  |  Logout' },
]);

cy += 98;
cy = drawSubHeading('5.6. Weather Intelligence & Spray Advisory Page', MARGIN_L, cy, 11);
drawScreenMockupFrame(26, cy, 158, 88, 'Microclimate Weather Intelligence • Mumbai, Maharashtra', [12, 74, 110], [
  { bg: [240, 249, 255], h: 22, bold: true, text: 'Temp: 29°C (Feels 31°C)  |  Humidity: 68% (Soil Moisture 72%)  |  Rain: 35%  |  Wind: 12 km/h' },
  { bg: [236, 253, 245], h: 36, text: 'AI Actionable Agricultural Guidance:\n• Irrigation: Slight delay recommended (35% afternoon rain chance).\n• Spraying: Favorable morning window before 11 AM (Wind < 15 km/h).\n• Disease Risk: Moderate fungal risk due to 68% humidity.' },
]);

// Page 73 (66 | P a g e): 5.7 7-Day Weather Forecast
nextPage(66);
cy = drawSubHeading('5.7. 7-Day Weather Forecast & Field Advisory Section', MARGIN_L, 28, 11);
drawScreenMockupFrame(30, cy, 150, 128, '7-Day Agricultural Weather Outlook', [12, 74, 110], [
  { bg: [255, 255, 255], h: 13, text: 'Today (Aug 12) • 31°/22°C • 35% Rain — Ideal for light weeding & soil testing' },
  { bg: [255, 255, 255], h: 13, text: 'Wed (Aug 13)   • 33°/23°C • 10% Rain — Great day for irrigation & fertilizer' },
  { bg: [254, 243, 199], h: 13, text: 'Thu (Aug 14)   • 30°/21°C • 75% Rain — Delay chemical sprays, clear drains' },
  { bg: [254, 226, 226], h: 13, text: 'Fri (Aug 15)   • 28°/20°C • 85% Rain — Thunderstorm alert, secure nursery' },
  { bg: [255, 255, 255], h: 13, text: 'Sat (Aug 16)   • 29°/21°C • 20% Rain — Inspect fields for waterlogging' },
  { bg: [236, 253, 245], h: 13, text: 'Sun (Aug 17)   • 32°/23°C •  5% Rain — Optimal for solar drying & harvest' },
  { bg: [236, 253, 245], h: 13, text: 'Mon (Aug 18)   • 33°/24°C • 15% Rain — Favorable for new seedling sowing' },
]);

// Page 74 (67 | P a g e): 5.8 & 5.9
nextPage(67);
cy = drawSubHeading('5.8. Smart Farm Insights & Yield Analytics', MARGIN_L, 28, 11);
drawScreenMockupFrame(26, cy, 158, 86, 'Smart Farm Insights & KPI Metrics', [28, 25, 23], [
  { bg: [236, 253, 245], h: 16, bold: true, text: 'Farm Health Score: 88%   |   Soil Health Index: 82%   |   Est. Yield: 15.3 Tons   |   Irrigation: 94%' },
  { bg: [255, 255, 255], h: 42, text: 'Recharts Crop Yield vs Target Comparison:\n• Rice (Paddy): Target 5.0 t/ha  |  Estimated 4.8 t/ha\n• Wheat: Target 4.2 t/ha  |  Estimated 4.3 t/ha\n• Maize: Target 6.0 t/ha  |  Estimated 6.2 t/ha' },
]);

cy += 96;
cy = drawSubHeading('5.9. Weekly Soil Moisture Trend & Disease Risk Matrix', MARGIN_L, cy, 11);
drawScreenMockupFrame(26, cy, 158, 86, 'Moisture Area Chart & Pathogen Risk Map', [28, 25, 23], [
  { bg: [240, 249, 255], h: 28, text: 'Weekly Soil Moisture & Humidity Trend (Mon-Sun):\nMon: 65%  ->  Tue: 72%  ->  Thu: 85% (22mm rain)  ->  Fri: 90%  ->  Sun: 75%' },
  { bg: [255, 251, 235], h: 30, text: 'Crop Disease Risk Matrix:\n• Tomato: Moderate Risk (Early Blight)\n• Rice: Low Risk (Blast)   |   • Wheat: Low Risk (Yellow Rust)' },
]);

// Page 75 (68 | P a g e): 5.10 & 5.11
nextPage(68);
cy = drawSubHeading('5.10. Voice Agronomic Assistant & Alerts Dropdown', MARGIN_L, 28, 11);
drawScreenMockupFrame(26, cy, 74, 88, 'Voice Assistant (Web Speech)', [6, 78, 59], [
  { bg: [236, 253, 245], h: 28, bold: true, text: '[ Listen Aloud (TTS) ] Button\nReads Crop Recommendations, Weather & Pathology Reports in 6 Indian Languages' },
  { bg: [255, 251, 235], h: 28, text: '[ Voice Input (Mic) ] Button\nHands-free speech dictation for location & field inputs' },
]);
drawScreenMockupFrame(110, cy, 74, 88, 'Emergency Weather Alerts', [146, 64, 14], [
  { bg: [255, 251, 235], h: 28, text: 'Alert 1 (Today): Scattered Rain Alert (35% Chance) - Delay foliar sprays.' },
  { bg: [254, 226, 226], h: 28, text: 'Alert 2 (Urgent): Fungal Pathogen Risk Warning - High humidity elevates blight risk.' },
]);

cy += 98;
cy = drawSubHeading('5.11. Profile Settings & Registration Metadata', MARGIN_L, cy, 11);
drawScreenMockupFrame(26, cy, 158, 78, 'Farmer Account Metadata & Privacy Guarantee', [6, 78, 59], [
  { bg: [255, 255, 255], h: 26, text: 'Member Since: 2026-01-15  |  Registered Phone: +91 98765 43210  |  Soil: Loamy Alluvial' },
  { bg: [236, 253, 245], h: 24, text: 'AI Data Privacy Guaranteed: Farm details, soil pH records, and leaf photos are processed securely.' },
]);

// Page 76 (69 | P a g e): 5.12 & 5.13
nextPage(69);
cy = drawSubHeading('5.12. Multilingual Selector & Accessibility Mode', MARGIN_L, 28, 11);
drawScreenMockupFrame(26, cy, 158, 78, 'Language & Text Accessibility Controls', [6, 95, 70], [
  { bg: [255, 255, 255], h: 24, text: 'Supported Languages: English (en) * Hindi (hi) * Marathi (mr) * Tamil (ta) * Telugu (te) * Kannada (kn)' },
  { bg: [254, 243, 199], h: 24, bold: true, text: 'Accessibility Toggle: [ Normal Text ]  <-->  [ Large Text (text-lg / sm:text-xl) ]' },
]);

cy += 88;
cy = drawSubHeading('5.13. Mobile Navigation & Activity History View', MARGIN_L, cy, 11);
drawScreenMockupFrame(26, cy, 158, 78, 'Mobile Bottom Bar & Farm Activities', [6, 78, 59], [
  { bg: [255, 255, 255], h: 28, text: 'Recent Farm Activities:\n• Soil Moisture & pH Scan (Completed 2h ago)  • Drip Irrigation Cycle (Completed)\n• Organic Neem Oil Foliar Spray (Scheduled Tomorrow 07:00 AM)' },
  { bg: [240, 253, 244], h: 20, bold: true, text: 'Bottom Nav Bar: [Dashboard] [Crops] [Disease] [Weather] [Insights]' },
]);

// =========================================================================
// PAGES 77–78 (70 | P a g e to 71 | P a g e): CHAPTER 6 - SUMMARY
// =========================================================================
nextPage(70);
cy = drawChapterHeader(6, 'SUMMARY', 28);
const summaryParasP1 = [
  'In today’s rapidly changing agricultural landscape, the need for scientific, timely, and accessible farming guidance is greater than ever. FarmEase (AI Digital Farming Assistant) is engineered to meet this demand by placing precision agronomy, plant pathology vision diagnostics, and hyper-local weather intelligence directly into the hands of farmers through an intuitive web application.',
  'Farmers benefit from FarmEase by gaining an all-in-one digital command center. Through multi-mode authentication (Mobile OTP, Email/Password, and New Farmer Registration), farmers persist their plot dimensions, regional district, soil classification, and primary crops seamlessly across sessions. This profile context automatically personalizes downstream crop recommendations and weather alerts.',
  'The AI Crop Recommendation Engine evaluates soil type, soil pH, water availability, temperature, sowing season, and crop rotation history to compute ranked suitability scores, expected yields per hectare, estimated profitability, and practical agronomic care tips. This empowers smallholder farmers to move away from guesswork and adopt data-driven crop planning.',
  'Moreover, the AI Plant Pathology Scanner addresses one of agriculture’s costliest challenges: delayed disease identification. By uploading a leaf photograph or capturing one live via smartphone camera, farmers immediately receive pathogen identification (such as Tomato Early Blight or Wheat Yellow Rust), confidence percentages, visible symptoms, and step-by-step organic and chemical remedies.',
  'In addition to improving crop health, FarmEase reduces resource waste and environmental harm. Hyper-local weather intelligence translates humidity, wind speeds, and rain probability into concrete irrigation and spraying advisories, preventing fertilizer wash-off and minimizing unnecessary pesticide applications.',
];
summaryParasP1.forEach((p) => {
  cy = writeParagraph(p, MARGIN_L, cy, CONTENT_W, 5.8, 0, 'normal', 11);
  cy += 2;
});

nextPage(71);
cy = 30;
const summaryParasP2 = [
  'Accessibility and inclusivity remain central pillars of FarmEase. With built-in localization across six Indian languages (English, Hindi, Marathi, Tamil, Telugu, and Kannada), a high-contrast Large Text readability toggle, and a Web Speech API Voice Assistant capable of both reading reports aloud and accepting voice dictation, farmers of varying literacy levels can navigate every tool effortlessly.',
  'In essence, FarmEase bridges the gap between modern Artificial Intelligence and grassroots agriculture. By combining React 19, TypeScript, Express.js, Google Gemini multimodal models, and resilient offline fallback logic into a clean responsive interface, the platform stands as a reliable, scalable companion for smarter farming and higher sustainable yields.',
];
summaryParasP2.forEach((p) => {
  cy = writeParagraph(p, MARGIN_L, cy, CONTENT_W, 6.0, 0, 'normal', 11);
  cy += 3;
});

// =========================================================================
// PAGE 79 (72 | P a g e): CHAPTER 7 - FUTURE ENHANCEMENTS
// =========================================================================
nextPage(72);
cy = drawChapterHeader(7, 'FUTURE ENHANCEMENTS', 28);
const futureItems = [
  ['❖', 'IoT Soil & Moisture Sensor Integration', 'Connecting field-deployed Bluetooth and LoRaWAN NPK, soil pH, and moisture probes directly to FarmEase for automated real-time telemetry without manual data entry.'],
  ['❖', 'Live e-NAM Mandi Price & Marketplace API', 'Integrating real-time Government of India APMC and e-NAM commodity auction prices so farmers can pair crop yield forecasts with live regional market rates and direct buyer connections.'],
  ['❖', 'Offline Edge AI Diagnostics (PWA + TensorFlow.js)', 'Packaging quantized on-device leaf classification models inside a Progressive Web App (PWA) so farmers in zero-network rural zones can scan crop leaves completely offline.'],
  ['❖', 'Satellite NDVI Crop Health Mapping', 'Incorporating Sentinel-2 multispectral satellite imagery to visualize Normalized Difference Vegetation Index (NDVI) heatmaps and detect water stress across larger farm plots.'],
  ['❖', 'Farmer Community Forums & Expert Live Consultation', 'Adding regional farmer discussion boards and direct video/chat escalation to certified Krishi Vigyan Kendra (KVK) agronomists for severe pest outbreaks.'],
];
futureItems.forEach(([sym, title, desc]) => {
  cy = writeBullet(sym, title, '', MARGIN_L, cy, CONTENT_W, 5.5, 11.5);
  cy = writeParagraph(desc, MARGIN_L + 8, cy - 1.5, CONTENT_W - 8, 5.5, 0, 'normal', 10.6);
  cy += 2;
});

cy = writeParagraph(
  'Through these enhancements, FarmEase will continue to evolve into a comprehensive digital agricultural ecosystem supporting sustainable farming, higher farmer incomes, and resilient food production.',
  MARGIN_L, cy + 4, CONTENT_W, 5.6, 0, 'normal', 10.8
);

// =========================================================================
// PAGE 80 (73 | P a g e): CHAPTER 8 - REFERENCES
// =========================================================================
nextPage(73);
cy = drawChapterHeader(8, 'REFERENCES', 28);
const refs = [
  '[1] React 19 Official Documentation: https://react.dev/',
  '[2] TypeScript Language Specification & Handbook: https://www.typescriptlang.org/docs/',
  '[3] Google Gemini API & @google/genai TypeScript SDK: https://ai.google.dev/gemini-api/docs',
  '[4] Tailwind CSS v4 Framework Documentation: https://tailwindcss.com/docs',
  '[5] Express.js Web Framework Documentation: https://expressjs.com/',
  '[6] Vite Next-Generation Frontend Tooling: https://vite.dev/',
  '[7] Recharts React Charting Library: https://recharts.org/',
  '[8] Web Speech API (MDN Web Docs): https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API',
  '[9] GitHub Actions & GitHub Pages Documentation: https://docs.github.com/en/pages',
  '[10] Indian Council of Agricultural Research (ICAR) Crop Guidelines: https://icar.org.in/',
];
refs.forEach((r) => {
  cy = writeParagraph(r, MARGIN_L, cy, CONTENT_W, 6, 0, 'normal', 11.2);
  cy += 3.5;
});

const totalPages = doc.getNumberOfPages();
console.log(`Total pages generated: ${totalPages}`);
if (totalPages !== 80) {
  throw new Error(`Expected exactly 80 pages, but got ${totalPages}`);
}

const outPath1 = path.resolve('public/FarmEase_BlackBook_Report.pdf');
const buffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outPath1, buffer);
console.log(`Saved ${outPath1} (${buffer.length} bytes, ${totalPages} pages)`);
