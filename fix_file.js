const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/pages/QRMenuDetail.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Lines are 0-indexed in array.
// Keep 0 to 681 (which is line 1 to 682)
// Skip 682 to 773 (which is line 683 to 774)
// Keep 774 to end (which is line 775 to end)

const part1 = lines.slice(0, 682);
const part2 = lines.slice(774);

const newContent = [...part1, ...part2].join('\n');

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('File fixed. Removed lines 683-774.');
