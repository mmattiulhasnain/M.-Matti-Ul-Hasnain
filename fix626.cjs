const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/motion\.tr>/g, '</tr>');
content = content.replace(/<\/AnimatePresence>\}/g, '}');

fs.writeFileSync('src/App.tsx', content);
