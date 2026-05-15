const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a PDF buffer for a given Request document.
 * @param {Object} request - Populated Request mongoose document (plain object)
 * @returns {Promise<Buffer>}
 */
function generateRequestPdf(request) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const { requestHeader, requestResponse } = request;
        const { clientData, ticket, serviceType, store, assignedTo, createdBy, comments } = requestHeader;

        const PRIMARY_COLOR = '#1a3c5e';
        const ACCENT_COLOR  = '#2e7bbf';
        const LIGHT_GRAY    = '#f5f5f5';
        const DARK_GRAY     = '#555555';
        const TEXT_COLOR    = '#222222';
        const PAGE_WIDTH    = doc.page.width - 100; // account for margins

        // ── HEADER BAR ──────────────────────────────────────────────────────────
        doc.rect(50, 40, PAGE_WIDTH, 72).fill(PRIMARY_COLOR);

        doc.fillColor('#ffffff')
           .fontSize(18)
           .font('Helvetica-Bold')
           .text('REPORTE DE SERVICIO', 60, 52, { width: PAGE_WIDTH - 200, align: 'left' });

        doc.fontSize(10)
           .font('Helvetica')
           .text(`Folio: ${ticket}`, 60, 76, { width: PAGE_WIDTH - 20, align: 'right' })

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#ccddee')
           .text(`Generado el ${formatDateTime(new Date())}`, 60, 90, { width: PAGE_WIDTH - 20, align: 'right' });

        // ── SECTION: Store & Service ─────────────────────────────────────────────
        let y = 128;

        // Store name as subtitle
        const storeName = store?.nombre_negocio ?? 'N/A';
        doc.fillColor(ACCENT_COLOR)
           .fontSize(13)
           .font('Helvetica-Bold')
           .text(storeName, 50, y);

        y += 18;
        doc.fillColor(DARK_GRAY)
           .fontSize(10)
           .font('Helvetica')
           .text(`Tipo de servicio: ${serviceType}  |  Formulario: ${requestResponse?.nombre_formulario ?? ''}`, 50, y);

        y += 25;
        drawHorizontalRule(doc, y, PRIMARY_COLOR);
        y += 12;

        // ── SECTION: Client Data ─────────────────────────────────────────────────
        y = sectionTitle(doc, 'DATOS DEL CLIENTE', y, PRIMARY_COLOR, PAGE_WIDTH);

        const clientFields = [
            ['Nombre completo', clientData?.clientFullName],
            ['Teléfono',        clientData?.clientNumberPhone],
            ['Correo',          clientData?.clientEmail],
            ['Dirección',       clientData?.clientAddress],
            ['Código postal',   clientData?.clientPostalCode],
        ];

        y = renderTwoColumnTable(doc, clientFields, y, PAGE_WIDTH, LIGHT_GRAY, TEXT_COLOR);
        y += 10;

        // ── SECTION: Ticket Info ─────────────────────────────────────────────────
        y = sectionTitle(doc, 'INFORMACIÓN DEL TICKET', y, PRIMARY_COLOR, PAGE_WIDTH);

        const ticketFields = [
            ['Asignado a',  assignedTo?.username ?? 'N/A'],
            ['Creado por',  createdBy?.username  ?? 'N/A'],
            ['Negocio',     storeName],
        ];

        y = renderTwoColumnTable(doc, ticketFields, y, PAGE_WIDTH, LIGHT_GRAY, TEXT_COLOR);

        if (comments) {
            y += 8;
            doc.fillColor(TEXT_COLOR).fontSize(9).font('Helvetica-Bold').text('Comentarios / Observaciones:', 50, y);
            y += 12;
            doc.fillColor(DARK_GRAY)
               .fontSize(9)
               .font('Helvetica')
               .text(comments, 50, y, { width: PAGE_WIDTH, lineGap: 3 });
            y = doc.y + 10;
        }

        y += 10;

        // ── SECTION: Form Response ───────────────────────────────────────────────
        const grupos = requestResponse?.grupos ?? [];
        
        const evidenciasAlFinal = [];
        const firmasAlFinal     = [];

        if (grupos.length > 0) {
            y = sectionTitle(doc, 'RESPUESTAS DEL FORMULARIO', y, PRIMARY_COLOR, PAGE_WIDTH);

            for (const grupo of grupos) {
                if (!grupo.activo) continue;

                // Check if we need a new page
                if (y > doc.page.height - 120) {
                    doc.addPage();
                    y = 50;
                }

                // Group sub-header
                doc.rect(50, y, PAGE_WIDTH, 20).fill(ACCENT_COLOR);
                doc.fillColor('#ffffff')
                   .fontSize(10)
                   .font('Helvetica-Bold')
                   .text(grupo.nombre_grupo, 56, y + 5, { width: PAGE_WIDTH - 12 });
                y += 22;

                const fieldRows = [];

                (grupo.fields ?? []).forEach(f => {
                    if (!f.activo) return;

                    if (f.fieldType === 'image') {
                        if (!f.answer || f.answer.trim() === '') {
                            fieldRows.push([f.label, 'Sin evidencias']);
                        } else {
                            const paths = f.answer.split(',').map(p => p.trim()).filter(Boolean);
                            if (paths.length > 0) {
                                fieldRows.push([f.label, `${paths.length} evidencia(s), ver al final del documento`]);
                                evidenciasAlFinal.push({
                                    grupo: grupo.nombre_grupo,
                                    label: f.label,
                                    paths: paths
                                });
                            } else {
                                fieldRows.push([f.label, 'Sin evidencias']);
                            }
                        }
                    } else if (
                        f.fieldType === 'signature' ||
                        f.fieldType === 'firma' ||
                        (f.answer && /^\/uploads\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(f.answer.trim()))
                    ) {
                        fieldRows.push([f.label, 'Ver al final del documento']);
                        firmasAlFinal.push({ grupo: grupo.nombre_grupo, label: f.label, path: f.answer?.trim() });
                    } else {
                        fieldRows.push([f.label, f.answer ?? '—']);
                    }
                });

                y = renderTwoColumnTable(doc, fieldRows, y, PAGE_WIDTH, LIGHT_GRAY, TEXT_COLOR);
                y += 10;
            }
        }

        // ── SECTION: Firmas ──────────────────────────────────────────────────────
        if (firmasAlFinal.length > 0) {
            doc.addPage();
            y = 50;
            y = sectionTitle(doc, 'FIRMAS', y, PRIMARY_COLOR, PAGE_WIDTH);
            y += 10;

            for (const firma of firmasAlFinal) {
                if (y + 170 > doc.page.height - 60) {
                    doc.addPage();
                    y = 50;
                }
                doc.fillColor(DARK_GRAY)
                   .fontSize(8)
                   .font('Helvetica-Bold')
                   .text(`Grupo: ${firma.grupo}`, 50, y);
                y += 12;
                y = renderSignatureBlock(doc, firma.label, firma.path, y, PAGE_WIDTH, ACCENT_COLOR);
                y += 15;
            }
        }

        // ── SECTION: Anexo Fotográfico ─────────────────
        if (evidenciasAlFinal.length > 0) {
            doc.addPage();
            y = 50;
            y = sectionTitle(doc, 'ANEXO DE EVIDENCIAS FOTOGRÁFICAS', y, PRIMARY_COLOR, PAGE_WIDTH);

            for (const evidencia of evidenciasAlFinal) {
                if (y > doc.page.height - 100) {
                    doc.addPage();
                    y = 50;
                }

                doc.fillColor(DARK_GRAY).fontSize(8).font('Helvetica-Bold').text(`Grupo: ${evidencia.grupo}`, 50, y);
                y += 12;
                doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold').text(evidencia.label, 50, y);
                y += 15;

                for (const imgPath of evidencia.paths) {
                    const absolutePath = path.join(process.cwd(), imgPath);

                    if (fs.existsSync(absolutePath)) {
                        if (y > doc.page.height - 250) {
                            doc.addPage();
                            y = 50;
                        }

                        try {
                            doc.y = y;
                            doc.x = 50;
                            doc.image(absolutePath, {
                                fit: [PAGE_WIDTH, 300],
                                align: 'center'
                            });
                            
                            y = doc.y + 20; 
                        } catch (error) {
                            doc.fillColor('red').fontSize(9).font('Helvetica').text(`[Error de formato al renderizar la imagen: ${imgPath}]`, 50, y);
                            y = doc.y + 15;
                        }
                    } else {
                        doc.fillColor(DARK_GRAY).fontSize(9).font('Helvetica').text(`[Archivo no encontrado físicamente: ${imgPath}]`, 50, y);
                        y = doc.y + 15;
                    }
                }
                
                y += 15;
            }
        }

        doc.end();
    });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sectionTitle(doc, title, y, color, width) {
    if (y > doc.page.height - 120) {
        doc.addPage();
        y = 50;
    }
    doc.fillColor(color)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(title, 50, y);
    y += 17;
    doc.rect(50, y, width, 2).fill(color);
    y += 8;
    return y;
}

function drawHorizontalRule(doc, y, color) {
    const width = doc.page.width - 100;
    doc.rect(50, y, width, 1).fill(color);
}

/**
 * Renders a two-column label/value table.
 * Returns the new y position.
 */
function renderTwoColumnTable(doc, rows, y, pageWidth, bgColor, textColor) {
    const colLabel = pageWidth * 0.38;
    const colValue = pageWidth * 0.62;
    const paddingX  = 6;
    const paddingY  = 5;
    const lineGap   = 2;

    rows.forEach((row, i) => {
        const [label, value] = row;
        const labelStr = String(label ?? '');
        const valueStr = String(value ?? '—');

        // Measure the actual height each cell needs so the rectangle fits the text
        doc.font('Helvetica-Bold').fontSize(9);
        const labelHeight = doc.heightOfString(labelStr, { width: colLabel - paddingX * 2, lineGap });

        doc.font('Helvetica').fontSize(9);
        const valueHeight = doc.heightOfString(valueStr, { width: colValue - paddingX * 2, lineGap });

        const rowHeight = Math.max(labelHeight, valueHeight) + paddingY * 2;
        const rowBg = i % 2 === 0 ? bgColor : '#ffffff';

        // Check page break using the real row height
        if (y + rowHeight > doc.page.height - 60) {
            doc.addPage();
            y = 50;
        }

        doc.rect(50, y, colLabel, rowHeight).fill(rowBg);
        doc.rect(50 + colLabel, y, colValue, rowHeight).fill('#ffffff');

        doc.fillColor('#333333')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text(labelStr, 50 + paddingX, y + paddingY, {
               width: colLabel - paddingX * 2,
               lineGap,
               lineBreak: true
           });

        doc.fillColor(textColor)
           .fontSize(9)
           .font('Helvetica')
           .text(valueStr, 50 + colLabel + paddingX, y + paddingY, {
               width: colValue - paddingX * 2,
               lineGap,
               lineBreak: true
           });

        y += rowHeight;
    });

    return y;
}

/**
 * Renders a signature image block below a group table.
 * Returns the new y position.
 */
function renderSignatureBlock(doc, label, imgPath, y, pageWidth, accentColor) {
    const BOX_W  = Math.min(pageWidth * 0.52, 280);
    const BOX_H  = 90;
    const margin = 50;

    if (y + BOX_H + 50 > doc.page.height - 60) {
        doc.addPage();
        y = 50;
    }

    // Label
    doc.fillColor('#333333')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(label + ':', margin, y);
    y += 13;

    // Box — light fill + colored border
    doc.rect(margin, y, BOX_W, BOX_H).fill('#f7f9fc');
    doc.rect(margin, y, BOX_W, BOX_H)
       .strokeColor(accentColor)
       .lineWidth(1.5)
       .stroke();

    const absolutePath = imgPath ? path.join(process.cwd(), imgPath) : null;
    if (absolutePath && fs.existsSync(absolutePath)) {
        try {
            doc.image(absolutePath, margin + 6, y + 6, {
                fit:    [BOX_W - 12, BOX_H - 12],
                align:  'center',
                valign: 'center'
            });
        } catch (e) {
            doc.fillColor('#aaa')
               .fontSize(8).font('Helvetica')
               .text('[Error al cargar la firma]', margin + 6, y + BOX_H / 2 - 5,
                     { width: BOX_W - 12, align: 'center' });
        }
    } else {
        doc.fillColor('#bbb')
           .fontSize(8).font('Helvetica')
           .text('[Sin firma]', margin + 6, y + BOX_H / 2 - 5,
                 { width: BOX_W - 12, align: 'center' });
    }

    y += BOX_H;

    // Signature underline + caption
    doc.rect(margin, y, BOX_W, 1.5).fill(accentColor);
    y += 5;
    doc.fillColor('#888')
       .fontSize(7)
       .font('Helvetica')
       .text(label, margin, y, { width: BOX_W, align: 'center' });
    y += 14;

    return y;
}

function formatDate(dateVal) {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(dateVal) {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    return d.toLocaleString('es-MX');
}

module.exports = { generateRequestPdf };