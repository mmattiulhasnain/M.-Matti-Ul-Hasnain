const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The best way is just to manually correct those lines. Let's fix line 447, 543, 577, 624.

// 447 - Access denied container
content = content.replace(/className="relative z-10 bg-white  border border-slate-200\/60 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-xl shadow-slate-200\/50 flex flex-col items-center text-center">\n          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 border border-red-200">/g, 'className="relative z-10 bg-white border border-slate-200/60 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">\n          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 border border-red-200">');

content = content.replace(/<\/div>\n        <\/div>\n      \);\n    }\n\n  return/g, '</motion.div>\n        </div>\n      );\n    }\n\n  return');
// Fix the opening tag for Access Denied if it's missing motion.div:
content = content.replace(/<div className="relative z-10 bg-white border border-slate-200\/60 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-xl shadow-slate-200\/50 flex flex-col items-center text-center">/, '<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="relative z-10 bg-white border border-slate-200/60 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">');

// 543 - roleStats map
content = content.replace(/<div className="flex items-baseline gap-2 mt-1">\n                  <span className=\{\`text-2xl font-bold \$\{stat\.color\}\`\}>\{stat\.count\}<\/span>\n                  <span className="text-xs text-slate-500 font-medium">Talent<\/span>\n                <\/div>\n              <\/div>/g, '<div className="flex items-baseline gap-2 mt-1">\n                  <span className={`text-2xl font-bold ${stat.color}`}>{stat.count}</span>\n                  <span className="text-xs text-slate-500 font-medium">Talent</span>\n                </div>\n              </motion.div>');

// 577 - table header
content = content.replace(/<th className="p-4 font-medium whitespace-nowrap text-right">Links<\/th>\n                    <\/motion\.tr>/g, '<th className="p-4 font-medium whitespace-nowrap text-right">Links</th>\n                  </tr>');

// 624 - 626 - table body loop closing
content = content.replace(/<\/motion\.tr>\n                    \)\)\n                    <\/AnimatePresence>\}/g, '</motion.tr>\n                  ))}\n                  </AnimatePresence>');
content = content.replace(/<motion\.tr \n                      key=\{record\.id\}\n                      initial=\{\{ opacity: 0, y: 10 \}\}\n                      animate=\{\{ opacity: 1, y: 0 \}\}\n                      exit=\{\{ opacity: 0, scale: 0\.95 \}\}\n                      transition=\{\{ duration: 0\.2 \}\}/g, '<motion.tr key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}');

// Check opening tr for table row inside map
content = content.replace(/<tr \n                      key=\{record\.id\}\n                      className="hover:bg-slate-50\/80 transition-colors group"/g, '<motion.tr key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="hover:bg-slate-50/80 transition-colors group"');

// Close motion.tr
content = content.replace(/<\/div>\n                        <\/td>\n                      <\/tr>/g, '</div>\n                        </td>\n                      </motion.tr>');

fs.writeFileSync('src/App.tsx', content);
