const fs = require('fs');
// Handle potential encoding issues by reading as buffer then string if needed, 
// but utf16le is standard for PowerShell > file
try {
    const content = fs.readFileSync('server_live.log', 'utf8'); // Try utf8 first as node writes in utf8
    const lines = content.split('\n');
    // Search for the specific log line that prints the Iyzico result
    const lastIndex = lines.findLastIndex(l => l.includes('Iyzico retrieve result'));

    if (lastIndex !== -1) {
        console.log('--- LOG EXTRACT ---');
        // Print context around the finding
        console.log(lines.slice(Math.max(0, lastIndex - 20), lastIndex + 50).join('\n'));
        console.log('--- END LOG EXTRACT ---');
    } else {
        console.log('PATTERN NOT FOUND: Iyzico retrieve result');
        console.log('--- LAST 50 LINES ---');
        console.log(lines.slice(-50).join('\n'));
    }
} catch (e) {
    // Fallback if file is ucs2/utf16le
    const content = fs.readFileSync('server_live.log', 'utf16le');
    const lines = content.split('\n');
    const lastIndex = lines.findLastIndex(l => l.includes('Iyzico retrieve result'));
    if (lastIndex !== -1) {
        console.log('--- LOG EXTRACT (UTF16) ---');
        console.log(lines.slice(Math.max(0, lastIndex - 20), lastIndex + 50).join('\n'));
    } else {
        console.log('--- LAST 50 LINES (UTF16) ---');
        console.log(lines.slice(-50).join('\n'));
    }
}
