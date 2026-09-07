const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The auth page access denied uses a standard div, let's just make sure it's closed correctly.
// I accidentally broke it.
content = content.replace(/<\/motion\.div>\n        <\/div>\n      \);\n    }\n\n  const isAllowed/, '</div>\n        </div>\n      );\n    }\n\n  const isAllowed'); // Actually my previous fix auth regex matched the wrong closing tag, wait.

// Let's just fix it carefully
// Error 1: 446:10: ERROR: Unexpected closing "motion.div" tag does not match opening "div" tag.
// This is the Access Denied block.
content = content.replace(/<\/motion\.div>\n        <\/div>\n      \);\n    }\n\n  return/, '</div>\n        </div>\n      );\n    }\n\n  return');

// Error 2: Unexpected closing "motion.tr" tag does not match opening "tr" tag
// Error 3: </AnimatePresence>}
content = content.replace(/<tr \n                      key=\{record\.id\}/, '<motion.tr \n                      key={record.id}');
content = content.replace(/<\/motion\.tr>\n                    \)\)\n                    <\/AnimatePresence>\}/, '</motion.tr>\n                  ))}\n                  </AnimatePresence>');

fs.writeFileSync('src/App.tsx', content);
