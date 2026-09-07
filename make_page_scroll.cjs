const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The auth screens still have 'h-screen w-screen'. Let's fix those to be full-page light themes without the generic dark blurs.
content = content.replace(/<div className="h-screen w-screen bg-\[#0f172a\] relative flex flex-col items-center justify-center overflow-hidden font-sans text-slate-100">/g, '<div className="min-h-screen w-full bg-slate-50 relative flex flex-col items-center justify-center overflow-hidden font-sans text-slate-900">');

// Remove the glowing blobs from auth screens which were left behind from previous fixes if they didn't match perfectly.
content = content.replace(/<div className="absolute top-\[-10%\].*?blur-\[120px\]"><\/div>\n/g, '');
content = content.replace(/<div className="absolute bottom-\[-10%\].*?blur-\[120px\]"><\/div>\n/g, '');

fs.writeFileSync('src/App.tsx', content);
