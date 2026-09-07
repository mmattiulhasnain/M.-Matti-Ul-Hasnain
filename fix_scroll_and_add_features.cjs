const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix scrolling
content = content.replace(/<main className="flex-1 flex flex-col p-4 sm:p-8">/, '<main className="flex-1 flex flex-col p-4 sm:p-8 min-h-0">');
content = content.replace(/<section className="flex-1 flex flex-col relative">/, '<section className="flex-1 flex flex-col relative min-h-0">');

// 2. Add Trash icon import
if (!content.includes('Trash2')) {
  content = content.replace(/import { Download, ChevronDown, Check, X, ArrowUpDown, ExternalLink, FileText, Plus, Loader2, LogOut } from 'lucide-react';/, "import { Download, ChevronDown, Check, X, ArrowUpDown, ExternalLink, FileText, Plus, Loader2, LogOut, Trash2 } from 'lucide-react';");
}

// 3. Add Export function
if (!content.includes('handleExportCSV')) {
  const exportFunc = `
  const handleExportCSV = () => {
    const dataToExport = selectedRows.size > 0 
      ? sortedRecords.filter(r => selectedRows.has(r.id))
      : sortedRecords;
    
    if (dataToExport.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Talent");
    XLSX.writeFile(wb, "talent_database.xlsx");
  };
  `;
  content = content.replace(/const handleAddRecord = async \(e: React\.FormEvent\) => \{/, exportFunc + '\n  const handleAddRecord = async (e: React.FormEvent) => {');
}

// 4. Add Delete function
if (!content.includes('handleDeleteSelected')) {
  const deleteFunc = `
  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    if (!window.confirm(\`Are you sure you want to delete \${selectedRows.size} record(s)?\`)) return;
    
    setIsLoading(true);
    try {
      for (const id of selectedRows) {
        await fetch(\`/api/records/\${id}\`, { method: 'DELETE' });
      }
      setRecords(records.filter(r => !selectedRows.has(r.id)));
      setSelectedRows(new Set());
    } catch (err) {
      console.error("Failed to delete records", err);
    }
    setIsLoading(false);
  };
  `;
  content = content.replace(/const handleAddRecord = async \(e: React\.FormEvent\) => \{/, deleteFunc + '\n  const handleAddRecord = async (e: React.FormEvent) => {');
}

// 5. Add UI Buttons for Export & Delete
const actionsHtml = `
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            
            {selectedRows.size > 0 && (
              <button 
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
                title="Delete Selected"
              >
                <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
              title="Export to Excel"
            >
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
            </button>
`;

content = content.replace(/<button \n              onClick={\(\) => setIsAddModalOpen\(true\)}/, actionsHtml + '\n            <button \n              onClick={() => setIsAddModalOpen(true)}');

fs.writeFileSync('src/App.tsx', content);
