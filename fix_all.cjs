const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/motion\.div>\n\s*<\/div>\n\s*<\/div>\n\s*\);\n\s*\}\n\n\s*return \(/g, '</div>\n        </div>\n      );\n    }\n\n  return (');
content = content.replace(/<motion\.div initial=\{\{ opacity: 0, y: 20 \}\} animate=\{\{ opacity: 1, y: 0 \}\} transition=\{\{ duration: 0\.5, ease: "easeOut" \}\} className="relative z-10 bg-white border border-slate-200\/60 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-xl shadow-slate-200\/50 flex flex-col items-center text-center">/g, '<div className="relative z-10 bg-white border border-slate-200/60 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">');
content = content.replace(/<\/motion\.div>\n\s*\}\)/g, '</div>\n              ))}');
content = content.replace(/<motion\.div\n\s*key=\{stat\.label\}/g, '<div\n                key={stat.label}');

content = content.replace(/<\/motion\.tr>\n\s*<\/thead>/g, '</tr>\n                  </thead>');
content = content.replace(/<motion\.tr \n\s*key=\{record\.id\}/g, '<tr \n                      key={record.id}');
content = content.replace(/<\/motion\.tr>\n\s*\)\)\}\n\s*<\/AnimatePresence>/g, '</tr>\n                    ))}');
content = content.replace(/<\/motion\.tr>\n\s*\)\)\n\s*<\/AnimatePresence>\}/g, '</tr>\n                    ))}');

content = content.replace(/<tbody className="divide-y divide-white\/5">\n\s*<AnimatePresence>/g, '<tbody className="divide-y divide-slate-100">');
content = content.replace(/<tbody className="divide-y divide-slate-100">\n\s*<AnimatePresence>/g, '<tbody className="divide-y divide-slate-100">');

content = content.replace(/<motion\.div \n\s*initial=\{\{ opacity: 0 \}\}\n\s*animate=\{\{ opacity: 1 \}\}/g, '<div');
content = content.replace(/<\/motion\.div>\n\s*<\/div>\n\s*\);\n\}/g, '</div>\n    </div>\n  );\n}');

fs.writeFileSync('src/App.tsx', content);
