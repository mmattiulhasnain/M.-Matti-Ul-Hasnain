const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Themed structural changes to App.tsx
// Convert to clean enterprise light mode

// 1. Remove background blobs
content = content.replace(/<div className="absolute top-\[-10%\].*?blur-\[120px\]"><\/div>\n/g, '');
content = content.replace(/<div className="absolute bottom-\[-10%\].*?blur-\[120px\]"><\/div>\n/g, '');
content = content.replace(/<div className="absolute top-\[20%\].*?blur-\[100px\]"><\/div>\n/g, '');
content = content.replace(/<div className="absolute top-\[-10%\].*?bg-red-600\/20.*?blur-\[120px\]"><\/div>\n/g, '');

// 2. Global body
content = content.replace(/bg-\[#0f172a\]/g, 'bg-slate-50');
content = content.replace(/text-slate-100/g, 'text-slate-900');
content = content.replace(/text-slate-200/g, 'text-slate-800');
content = content.replace(/text-slate-300/g, 'text-slate-700');
content = content.replace(/text-slate-400/g, 'text-slate-500');

// 3. Modals and Cards
content = content.replace(/bg-white\/5/g, 'bg-white');
content = content.replace(/bg-white\/10/g, 'bg-slate-50');
content = content.replace(/border-white\/10/g, 'border-slate-200');
content = content.replace(/backdrop-blur-xl/g, '');
content = content.replace(/backdrop-blur-md/g, '');

// 4. Header & Top Bar
content = content.replace(/bg-\[#1e293b\]/g, 'bg-white');
content = content.replace(/bg-slate-800/g, 'bg-slate-50');
content = content.replace(/border-slate-600/g, 'border-slate-200');

// 5. Table container and Table itself
content = content.replace(/bg-\[#1e293b\]\/60/g, 'bg-white');
content = content.replace(/border-slate-700\/50/g, 'border-slate-200');
content = content.replace(/bg-\[#0f172a\]\/95/g, 'bg-slate-100');
content = content.replace(/text-white/g, 'text-slate-900');
content = content.replace(/hover:bg-white\/5/g, 'hover:bg-slate-50');
content = content.replace(/border-b border-white\/5/g, 'border-b border-slate-100');
content = content.replace(/bg-slate-800\/50/g, 'bg-slate-100');

// 6. Badges & Tags
content = content.replace(/bg-indigo-500\/20/g, 'bg-indigo-50');
content = content.replace(/text-indigo-300/g, 'text-indigo-700');
content = content.replace(/border-indigo-500\/30/g, 'border-indigo-200');
content = content.replace(/hover:bg-indigo-500\/40/g, 'hover:bg-indigo-100');

// 7. Inputs
content = content.replace(/focus:bg-white\/10/g, 'focus:bg-white');
content = content.replace(/focus:border-indigo-500/g, 'focus:border-blue-500');
content = content.replace(/focus:ring-indigo-500/g, 'focus:ring-blue-500');
content = content.replace(/focus:ring-teal-500/g, 'focus:ring-blue-500');

// 8. Custom dropdowns & modals
content = content.replace(/bg-slate-700/g, 'bg-slate-100');
content = content.replace(/bg-black\/50/g, 'bg-slate-900\/50');

// Additional fix for Access denied SVG
content = content.replace(/text-red-400/g, 'text-red-600');
content = content.replace(/bg-red-500\/20/g, 'bg-red-50');
content = content.replace(/border-red-500\/30/g, 'border-red-200');

// Empty state fixes
content = content.replace(/border-slate-700/g, 'border-slate-200');

// Update custom scrollbar (index.css instead of App.tsx but we'll leave it as is)

fs.writeFileSync('src/App.tsx', content);
