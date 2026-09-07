const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove all glowing background blobs everywhere
content = content.replace(/<div className="absolute top-\[-10%\].*?blur-\[120px\]"><\/div>\n?/g, '');
content = content.replace(/<div className="absolute bottom-\[-10%\].*?blur-\[120px\]"><\/div>\n?/g, '');
content = content.replace(/<div className="absolute top-\[20%\].*?blur-\[100px\]"><\/div>\n?/g, '');
content = content.replace(/<div className="absolute top-\[-10%\].*?bg-red-600\/20.*?blur-\[120px\]"><\/div>\n?/g, '');

// 2. Fix the global backgrounds from dark to clean light
content = content.replace(/bg-\[#0f172a\]/g, 'bg-slate-50');
content = content.replace(/bg-\[#1e293b\]/g, 'bg-white');
content = content.replace(/bg-\[#0f172a\]\/95/g, 'bg-slate-50');

// 3. Fix Auth Screen / Access Denied containers and text
// Convert generic text-slate-100 to text-slate-900 in containers
content = content.replace(/text-slate-100/g, 'text-slate-900');
content = content.replace(/text-slate-300/g, 'text-slate-700');
content = content.replace(/text-slate-400/g, 'text-slate-500');

// Fix Auth screen container
content = content.replace(/bg-white\/5 backdrop-blur-xl border border-white\/10/g, 'bg-white border border-slate-200');
content = content.replace(/text-white/g, 'text-slate-900');

// Fix "Save Record" button text (which became text-slate-900 on indigo-600)
content = content.replace(/bg-indigo-600 hover:bg-indigo-500 text-slate-900/g, 'bg-indigo-600 hover:bg-indigo-700 text-white');

// Fix Sign Out button
content = content.replace(/bg-white\/10 hover:bg-white\/20 border border-white\/10 text-slate-900/g, 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700');

// Clean up some stray artifacts on the filter buttons
content = content.replace(/hover:bg-slate-800/g, 'hover:bg-slate-50');
content = content.replace(/text-slate-200/g, 'text-slate-800');

// Fix select inputs inside modal
content = content.replace(/className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2\.5 text-sm text-slate-900/g, 'className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900');

fs.writeFileSync('src/App.tsx', content);
