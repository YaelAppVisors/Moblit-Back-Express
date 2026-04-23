const PDFDocument = require('pdfkit');

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

                const fieldRows = (grupo.fields ?? [])
                    .filter(f => f.activo)
                    .map(f => [f.label, f.answer ?? '—']);

                y = renderTwoColumnTable(doc, fieldRows, y, PAGE_WIDTH, LIGHT_GRAY, TEXT_COLOR);
                y += 10;
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
    y += 6;
    doc.rect(50, y, width, 2).fill(color);
    y += 10;
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
    const rowHeight = 20;
    const paddingX = 6;
    const paddingY = 5;

    rows.forEach((row, i) => {
        const [label, value] = row;
        const rowBg = i % 2 === 0 ? bgColor : '#ffffff';

        // Check page break
        if (y + rowHeight > doc.page.height - 60) {
            doc.addPage();
            y = 50;
        }

        doc.rect(50, y, colLabel, rowHeight).fill(rowBg);
        doc.rect(50 + colLabel, y, colValue, rowHeight).fill('#ffffff');

        doc.fillColor('#333333')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text(label ?? '', 50 + paddingX, y + paddingY, { width: colLabel - paddingX * 2 });

        doc.fillColor(textColor)
           .fontSize(9)
           .font('Helvetica')
           .text(String(value ?? '—'), 50 + colLabel + paddingX, y + paddingY, { width: colValue - paddingX * 2 });

        y += rowHeight;
    });

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
