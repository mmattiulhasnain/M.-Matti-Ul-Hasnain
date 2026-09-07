const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\}\)/, '</div>\n          </div>\n      )}');

fs.writeFileSync('src/App.tsx', content);
