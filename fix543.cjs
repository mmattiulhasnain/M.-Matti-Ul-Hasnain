const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/motion\.div>\n\s*\}\)\}/g, '</div>\n            ))}');
fs.writeFileSync('src/App.tsx', content);
