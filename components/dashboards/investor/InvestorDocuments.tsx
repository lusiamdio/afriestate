import React, { useMemo, useState } from 'react';
import type { User } from '../../../types';
import { getInvestorDocuments } from '../../../lib/data';
import { DocumentTextIcon } from '../../icons/ActionIcons';
import { DownloadIcon } from '../../icons/AgentDashboardIcons';
import { useToast } from '../../../contexts/ToastContext';

interface InvestorDocumentsProps {
  user: User;
}

const InvestorDocuments: React.FC<InvestorDocumentsProps> = () => {
  const documents = useMemo(() => getInvestorDocuments(), []);
  const [filterType, setFilterType] = useState<string>('All');
  const { addToast } = useToast();

  const types = useMemo(() => ['All', ...Array.from(new Set(documents.map((d) => d.type)))], [documents]);

  const filteredDocs = useMemo(() => {
    if (filterType === 'All') return documents;
    return documents.filter((d) => d.type === filterType);
  }, [documents, filterType]);

  const handleDownload = (docName: string) => {
    const content = `AfriEstate Investor Vault Document\nDocument: ${docName}\nGenerated: ${new Date().toISOString()}\nStatus: Verified Copy`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast(`Downloaded "${docName}"`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Contracts &amp; Document Vault
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Executed deeds, quarterly tax certificates, and verified investment statements.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                filterType === t
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Document Name</th>
                <th className="px-5 py-3 text-left font-medium">Classification</th>
                <th className="px-5 py-3 text-left font-medium">Issued</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
                    <DocumentTextIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">{doc.type}</td>
                  <td className="px-5 py-3.5 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(doc.date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDownload(doc.name)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2D25] dark:text-emerald-400 hover:underline whitespace-nowrap"
                    >
                      <DownloadIcon className="w-4 h-4" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredDocs.length === 0 && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">
            No documents match the selected classification.
          </p>
        )}
      </div>
    </div>
  );
};

export default InvestorDocuments;
