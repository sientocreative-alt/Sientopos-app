const { createClient } = require('@supabase/supabase-js');
const net = require('net');
const dotenv = require('dotenv');
const Jimp = require('jimp');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env');
    return;
}

const supabase = createClient(supabaseUrl, supabaseKey);

const https = require('https');
const fs = require('fs');
const path = require('path');

const PAGE_WIDTH = 40;
const CONTENT_WIDTH = 32;
const MARGIN_SIZE = Math.floor((PAGE_WIDTH - CONTENT_WIDTH) / 2);
const MARGIN = ' '.repeat(MARGIN_SIZE);

const logStatus = (msg) => {
    try {
        const logPath = 'c:/Users/MSI/Desktop/pos/server/services/printer_debug.log';
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) { }
};

const fetchImage = (url, depth = 0) => {
    return new Promise((resolve, reject) => {
        if (depth > 5) return reject(new Error('Too many redirects'));
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve(fetchImage(res.headers.location, depth + 1));
                return;
            }
            if (res.statusCode !== 200) return reject(new Error(`Fetch failed: ${res.statusCode}`));
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
};

/**
 * V11 - The "Safe Raster" Option
 * Uses GS v 0 with explicit reset and small width.
 */
async function processLogo(source) {
    try {
        if (!source) return null;
        let imgBuffer;

        if (source.startsWith('BASE64IMG:')) {
            logStatus(`V11 Base64 detected`);
            imgBuffer = Buffer.from(source.replace('BASE64IMG:', ''), 'base64');
        } else {
            logStatus(`V11 URL detected: ${source}`);
            imgBuffer = await fetchImage(source);
        }

        const sourceImage = await Jimp.read(imgBuffer);

        // Use 128px for absolute safety (16 bytes)
        const width = 128;
        const height = Math.round((sourceImage.bitmap.height / sourceImage.bitmap.width) * width);
        const canvas = new Jimp(width, height, 0xFFFFFFFF);
        sourceImage.resize(width, Jimp.AUTO);
        canvas.composite(sourceImage, 0, 0);
        canvas.greyscale();

        const widthBytes = 16;
        const imgData = Buffer.alloc(widthBytes * height, 0x00);

        for (let y = 0; y < height; y++) {
            for (let xByte = 0; xByte < widthBytes; xByte++) {
                let byte = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const x = xByte * 8 + bit;
                    const pixel = Jimp.intToRGBA(canvas.getPixelColor(x, y));
                    if ((pixel.r + pixel.g + pixel.b) / 3 < 128) byte |= (0x80 >> bit);
                }
                imgData[y * widthBytes + xByte] = byte;
            }
        }

        const bufferParts = [];
        bufferParts.push(Buffer.from([0x1B, 0x40])); // Initialize
        bufferParts.push(Buffer.from([0x1B, 0x61, 0x01])); // Center
        // GS v 0 m xL xH yL yH
        bufferParts.push(Buffer.from([0x1D, 0x76, 0x30, 0x00, widthBytes, 0x00, height & 0xFF, (height >> 8) & 0xFF]));
        bufferParts.push(imgData);
        bufferParts.push(Buffer.from([0x0A, 0x1B, 0x61, 0x00])); // LF + Left Align

        logStatus(`V11 SUCCESS: ${width}x${height}`);
        return Buffer.concat(bufferParts);
    } catch (err) {
        logStatus(`V11 ERROR: ${err.message}`);
        return null;
    }
}

/**
 * Clean Turkish characters to ASCII
 */
const turkishToAscii = (text) => {
    if (!text) return "";
    const mapping = {
        'ğ': 'g', 'Ğ': 'G', 'ş': 's', 'Ş': 'S', 'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C', 'ü': 'u', 'Ü': 'U'
    };
    return text.toString().split('').map(char => mapping[char] || char).join('');
};

const manualCenter = (text) => {
    const cleanText = turkishToAscii(text);
    if (cleanText.length >= CONTENT_WIDTH) return MARGIN + cleanText;
    const leftPad = Math.floor((CONTENT_WIDTH - cleanText.length) / 2);
    return MARGIN + ' '.repeat(leftPad) + cleanText;
};

const alignLeftRight = (leftText, rightText) => {
    const L = turkishToAscii(leftText);
    const R = turkishToAscii(rightText);
    const available = CONTENT_WIDTH - L.length - R.length;
    return MARGIN + L + ' '.repeat(Math.max(1, available)) + R;
};

const separator = () => MARGIN + '-'.repeat(CONTENT_WIDTH);

const sendToPrinter = (ip, port, data) => {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        client.setTimeout(5000);
        client.connect(port, ip, () => {
            logStatus(`Connected to printer at ${ip}:${port}`);
            const parts = Array.isArray(data) ? data : [data];
            const finalBuffer = Buffer.concat(parts.map(p =>
                Buffer.isBuffer(p) ? p : Buffer.from(p, 'latin1')
            ));
            setTimeout(() => {
                client.write(finalBuffer, () => {
                    client.end();
                    resolve(true);
                });
            }, 200);
        });
        client.on('error', (err) => { logStatus(`Net Error: ${err.message}`); client.destroy(); reject(err); });
        client.on('timeout', () => { logStatus(`Timeout Error`); client.destroy(); reject(new Error('Timeout')); });
    });
};

/**
 * Formats Kitchen Receipt (Super Safe - No Commands)
 * Groups multiple items into one receipt.
 */
const formatKitchenReceipt = (items, tableName, staffName) => {
    let lines = [];
    lines.push(manualCenter("MUTFAK FISI"));
    lines.push(separator());
    lines.push(alignLeftRight("GARSON:", staffName || 'Personel'));
    lines.push(alignLeftRight("MASA:", tableName || 'Masa'));
    lines.push(alignLeftRight("SAAT:", new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })));
    lines.push(separator());
    lines.push("");

    // Group identical items
    const groupedItems = [];
    items.forEach(item => {
        const modifiersKey = JSON.stringify(item.modifiers || []);
        const itemKey = `${item.name}-${item.note}-${modifiersKey}`;
        const existing = groupedItems.find(g => g.key === itemKey);

        if (existing) {
            existing.quantity += (item.quantity || 1);
        } else {
            groupedItems.push({
                key: itemKey,
                name: item.name,
                note: item.note,
                modifiers: item.modifiers,
                quantity: item.quantity || 1
            });
        }
    });

    groupedItems.forEach(item => {
        let name = item.name;
        if (name.length > 25) name = name.substring(0, 22) + '...';
        lines.push(MARGIN + turkishToAscii(`${item.quantity}x ${name}`));

        if (item.note) {
            lines.push(MARGIN + "  NOT: " + turkishToAscii(item.note));
        }

        if (item.modifiers && item.modifiers.length > 0) {
            item.modifiers.forEach(mod => {
                lines.push(MARGIN + "  + " + turkishToAscii(mod.name));
            });
        }
    });

    lines.push("");
    lines.push(separator());
    lines.push(manualCenter("Fis No: " + (items[0]?.id?.toString().substring(0, 4) || '0000')));
    lines.push("\n\n\n\n\n");

    return Buffer.from(lines.join('\n'), 'latin1');
};

/**
 * Formats Cancellation Receipt (İPTAL FİŞİ)
 * Groups multiple cancellations/gifts/waste into one receipt.
 */
const formatCancellationReceipt = (items, tableName, staffName) => {
    let lines = [];
    lines.push(manualCenter("!!! IPTAL FISI !!!"));
    lines.push(separator());
    lines.push(alignLeftRight("GARSON:", staffName || 'Personel'));
    lines.push(alignLeftRight("MASA:", tableName || 'Masa'));
    lines.push(alignLeftRight("SAAT:", new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })));
    lines.push(separator());
    lines.push("");

    // Group identical items
    const groupedItems = [];
    items.forEach(item => {
        const modifiersKey = JSON.stringify(item.modifiers || []);
        const itemKey = `${item.name}-${item.note}-${item.status}-${modifiersKey}`;
        const existing = groupedItems.find(g => g.key === itemKey);

        if (existing) {
            existing.quantity += (item.quantity || 1);
        } else {
            groupedItems.push({
                key: itemKey,
                name: item.name,
                note: item.note,
                status: item.status,
                modifiers: item.modifiers,
                quantity: item.quantity || 1
            });
        }
    });

    groupedItems.forEach(item => {
        let name = item.name;
        if (name.length > 25) name = name.substring(0, 22) + '...';

        let statusText = "IPTAL";
        if (item.status === 'gift') statusText = "IKRAM";
        if (item.status === 'waste') statusText = "ATIK";

        lines.push(MARGIN + turkishToAscii(`[${statusText}] ${item.quantity}x ${name}`));
        if (item.note) {
            lines.push(MARGIN + "  NEDEN: " + turkishToAscii(item.note));
        }
    });

    lines.push("");
    lines.push(separator());
    lines.push(manualCenter("Fis No: " + (items[0]?.id?.toString().substring(0, 4) || '0000')));
    lines.push("\n\n\n\n\n");

    return Buffer.from(lines.join('\n'), 'latin1');
};

/**
 * Formats Account Receipt with Dynamic Logo Support
 */
const formatAccountsReceipt = async (payload) => {
    let binaryLogo = null;
    if (payload.print_logo_on_receipt && payload.logo_url) {
        binaryLogo = await processLogo(payload.logo_url);
    }

    const headerLines = [];
    if (!binaryLogo) {
        headerLines.push(manualCenter(payload.business_name || 'COFFEE SHOP'));
    }
    headerLines.push(manualCenter(payload.business_address || "MERKEZ SUBE"));
    headerLines.push("");

    const middleLines = [];
    middleLines.push(alignLeftRight("PERSONEL:", payload.personnel || 'Personel'));
    middleLines.push(alignLeftRight("MASA NO:", payload.table_name || 'Masa'));
    middleLines.push(alignLeftRight("ZAMAN:", new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })));
    middleLines.push(separator());
    middleLines.push(alignLeftRight("URUN", "TUTAR"));
    middleLines.push(separator());

    const unpaidItemsRaw = payload.items.filter(i => !['paid', 'gift', 'waste', 'cancel'].includes(i.status));
    const paidItemsRaw = payload.items.filter(i => i.status === 'paid');

    // Grouping Helper
    const groupItems = (items) => {
        const groups = [];
        items.forEach(item => {
            const itemKey = `${item.name}-${item.price}`;
            const existing = groups.find(g => g.key === itemKey);
            if (existing) {
                existing.quantity += (item.quantity || 1);
            } else {
                groups.push({
                    key: itemKey,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity || 1
                });
            }
        });
        return groups;
    };

    const unpaidGroups = groupItems(unpaidItemsRaw);
    const paidGroups = groupItems(paidItemsRaw);

    if (unpaidGroups.length > 0) {
        unpaidGroups.forEach(item => {
            let name = item.name;
            if (name.length > 18) name = name.substring(0, 15) + '...';
            middleLines.push(alignLeftRight(`${item.quantity}x ${name}`, `${(item.price * item.quantity).toFixed(2)} TL`));
        });
    } else {
        middleLines.push(manualCenter("- ODENECEK URUN YOK -"));
    }

    middleLines.push(separator());

    // Total should be the sum of UNPAID items (the remaining balance)
    const remainingBalance = unpaidGroups.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    middleLines.push(alignLeftRight("KALAN TOPLAM", `${remainingBalance.toFixed(2)} TL`));
    middleLines.push(separator());

    // Already Paid Section
    if (paidGroups.length > 0) {
        middleLines.push("");
        middleLines.push(manualCenter("ODENENLER"));
        middleLines.push(separator());
        paidGroups.forEach(item => {
            let name = item.name;
            if (name.length > 18) name = name.substring(0, 15) + '...';
            middleLines.push(alignLeftRight(`${item.quantity}x ${name}`, `[ODENDI]`));
        });
        const alreadyPaidTotal = paidGroups.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        middleLines.push(separator());
        middleLines.push(alignLeftRight("ARA TOPLAM (ODENEN)", `${alreadyPaidTotal.toFixed(2)} TL`));
        middleLines.push(separator());
    }

    middleLines.push("");
    middleLines.push(manualCenter("AFIYET OLSUN"));
    middleLines.push("\n\n\n\n\n");

    const headerText = headerLines.join('\n') + '\n';
    const middleText = middleLines.join('\n');

    const resultParts = [];
    if (binaryLogo) resultParts.push(binaryLogo);
    resultParts.push(Buffer.from(headerText, 'latin1'));
    resultParts.push(Buffer.from(middleText, 'latin1'));

    return Buffer.concat(resultParts);
};

const handlePrintCycle = async (printerId, printData, context) => {
    try {
        const { data: printer, error: pError } = await supabase
            .from('printers')
            .select('*')
            .eq('id', printerId)
            .single();

        if (pError || !printer) return false;
        if (!printer.connection_port) return false;

        let ip = printer.connection_port;
        let port = 9100;
        if (ip.includes(':')) {
            const parts = ip.split(':');
            ip = parts[0];
            port = parseInt(parts[1]) || 9100;
        }

        logStatus(`ATTEMPTING PRINT [${context}]: To ${ip}:${port}...`);
        await sendToPrinter(ip, port, printData);
        return true;
    } catch (err) {
        logStatus(`FAILED [${context}]: ${err.message}`);
        console.error(`FAILED [${context}]:`, err.message);
        return false;
    }
};

const kitchenBuffer = new Map();
const cancelBuffer = new Map();

const initPrinterService = () => {
    logStatus('Printer Service Initializing (FIX GROUPING)...');

    supabase
        .channel('kitchen_bridge')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_items' }, async (payload) => {
            try {
                const newItem = payload.new;
                const printerId = newItem.printer_id || newItem.metadata?.target_printer_id;
                if (!printerId) return;

                const tableId = newItem.table_id || 'general';
                const bufferKey = `${printerId}:${tableId}`;

                if (!kitchenBuffer.has(bufferKey)) {
                    kitchenBuffer.set(bufferKey, { items: [], timeout: null, staffName: newItem.staff_name });
                }

                const buffer = kitchenBuffer.get(bufferKey);
                buffer.items.push(newItem);
                buffer.staffName = newItem.staff_name;

                if (buffer.timeout) clearTimeout(buffer.timeout);

                buffer.timeout = setTimeout(async () => {
                    const finalBuffer = kitchenBuffer.get(bufferKey);
                    kitchenBuffer.delete(bufferKey);

                    if (!finalBuffer || finalBuffer.items.length === 0) return;

                    const firstItem = finalBuffer.items[0];
                    let tableName = 'Masa';
                    if (firstItem.table_id) {
                        const { data: table } = await supabase
                            .from('tables')
                            .select('name, seating_area:seating_area_id(name)')
                            .eq('id', firstItem.table_id)
                            .single();
                        if (table) {
                            const areaName = table.seating_area?.name || '';
                            tableName = areaName ? `${areaName} - ${table.name}` : table.name;
                        }
                    }

                    const printData = formatKitchenReceipt(finalBuffer.items, tableName, finalBuffer.staffName);
                    await handlePrintCycle(printerId, printData, 'KITCHEN_GROUPED');
                }, 1500); // 1.5s window for grouping
            } catch (err) {
                logStatus(`Kitchen Bridge Error: ${err.message}`);
            }
        })
        .subscribe();

    supabase
        .channel('cancel_bridge')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_items' }, async (payload) => {
            try {
                const oldItem = payload.old;
                const newItem = payload.new;

                // Detect status change to cancelled, gift, or waste
                const isCancellation = (newItem.status === 'cancel' || newItem.status === 'gift' || newItem.status === 'waste') &&
                    (oldItem.status !== newItem.status);

                if (!isCancellation) return;

                const printerId = newItem.printer_id || newItem.metadata?.target_printer_id;
                if (!printerId) return;

                const tableId = newItem.table_id || 'general';
                const bufferKey = `${printerId}:${tableId}`;

                if (!cancelBuffer.has(bufferKey)) {
                    cancelBuffer.set(bufferKey, { items: [], timeout: null, staffName: newItem.staff_name });
                }

                const buffer = cancelBuffer.get(bufferKey);
                buffer.items.push(newItem);
                buffer.staffName = newItem.staff_name;

                if (buffer.timeout) clearTimeout(buffer.timeout);

                buffer.timeout = setTimeout(async () => {
                    const finalBuffer = cancelBuffer.get(bufferKey);
                    cancelBuffer.delete(bufferKey);

                    if (!finalBuffer || finalBuffer.items.length === 0) return;

                    const firstItem = finalBuffer.items[0];
                    let tableName = 'Masa';
                    if (firstItem.table_id) {
                        const { data: table } = await supabase
                            .from('tables')
                            .select('name, seating_area:seating_area_id(name)')
                            .eq('id', firstItem.table_id)
                            .single();
                        if (table) {
                            const areaName = table.seating_area?.name || '';
                            tableName = areaName ? `${areaName} - ${table.name}` : table.name;
                        }
                    }

                    const printData = formatCancellationReceipt(finalBuffer.items, tableName, finalBuffer.staffName);
                    await handlePrintCycle(printerId, printData, 'KITCHEN_CANCEL_GROUPED');
                }, 1500);
            } catch (err) {
                logStatus(`Cancel Bridge Error: ${err.message}`);
            }
        })
        .subscribe();

    supabase
        .channel('jobs_bridge')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'print_jobs' }, async (payload) => {
            try {
                const job = payload.new;
                let printerId = job.printer_id;

                if (!printerId && job.job_type === 'account_receipt') {
                    const { data: accPrinter } = await supabase
                        .from('printers')
                        .select('id')
                        .eq('business_id', job.business_id)
                        .eq('is_account_printer', true)
                        .single();
                    if (accPrinter) printerId = accPrinter.id;
                }

                if (!printerId) return;

                if (job.job_type === 'account_receipt') {
                    const printData = await formatAccountsReceipt(job.payload);
                    const success = await handlePrintCycle(printerId, printData, 'JOB:' + job.job_type);
                    await supabase.from('print_jobs').update({ status: success ? 'completed' : 'failed' }).eq('id', job.id);
                } else if (job.job_type === 'open_drawer') {
                    const printData = Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]);
                    const success = await handlePrintCycle(printerId, printData, 'JOB:' + job.job_type);
                    await supabase.from('print_jobs').update({ status: success ? 'completed' : 'failed' }).eq('id', job.id);
                }
            } catch (err) {
                logStatus(`Bridge Error: ${err.message}`);
            }
        })
        .subscribe();
};

module.exports = { initPrinterService };
