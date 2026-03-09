import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HiDocumentDownload } from 'react-icons/hi';

const REPORT_TYPES = ['Weekly', 'Monthly'];

export default function ExportReport({ data = [] }) {
  const [reportType, setReportType] = useState('Weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const validate = () => {
    if (!startDate || !endDate) return 'Please select both start and end dates.';
    if (new Date(endDate) < new Date(startDate)) return 'End date must be after start date.';
    return '';
  };

  const handleGenerate = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setGenerating(true);

    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text(`FlowTrack ${reportType} Report`, 14, 20);

      // Date range
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Period: ${startDate} — ${endDate}`, 14, 30);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37);

      // Summary table
      const tableData = data.length > 0
        ? data.map((row) => [
            row.task ?? row.title ?? row.name ?? '—',
            row.assignee ?? row.assigneeName ?? '—',
            row.status ?? '—',
            row.hours != null ? `${row.hours}h` : '—',
          ])
        : [['No data available', '', '', '']];

      autoTable(doc, {
        startY: 45,
        head: [['Task / Item', 'Assignee', 'Status', 'Hours']],
        body: tableData,
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { fontSize: 10, cellPadding: 3 },
      });

      const filename = `flowtrack-${reportType.toLowerCase()}-report-${startDate}-to-${endDate}.pdf`;
      doc.save(filename);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-5">
        <HiDocumentDownload size={20} className="text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Export Report</h2>
      </div>

      <div className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Report type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Report Type
          </label>
          <div className="flex gap-2">
            {REPORT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setReportType(type)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  reportType === type
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <HiDocumentDownload size={16} />
          {generating ? 'Generating…' : `Generate ${reportType} PDF`}
        </button>
      </div>
    </div>
  );
}
