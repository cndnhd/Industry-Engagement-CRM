'use client';

import { useState, useRef, useCallback } from 'react';
import Modal from '@/components/ui/Modal';

export type ImportRowResult = {
  row: number;
  data: Record<string, string>;
  error?: string;
  status: 'pending' | 'valid' | 'error' | 'duplicate';
};

export type ImportConfig = {
  expectedHeaders: { csvHeader: string; fieldKey: string; required?: boolean }[];
  duplicateField?: string;
  duplicatePolicy: 'skip' | 'update' | 'fail';
  existingValues?: Set<string>;
  validate?: (row: Record<string, string>) => string | null;
};

type ImportDialogProps = {
  open: boolean;
  onClose: () => void;
  config: ImportConfig;
  onConfirm: (validRows: Record<string, string>[]) => Promise<void>;
  entityName: string;
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      current.push(cell.trim());
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      current.push(cell.trim());
      if (current.some(c => c !== '')) rows.push(current);
      current = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  current.push(cell.trim());
  if (current.some(c => c !== '')) rows.push(current);
  return rows;
}

function ImportDialog({ open, onClose, config, onConfirm, entityName }: ImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportRowResult[] | null>(null);
  const [headerMap, setHeaderMap] = useState<Record<number, string>>({});
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ success: number; skipped: number; failed: number } | null>(null);

  const reset = useCallback(() => {
    setPreview(null);
    setHeaderMap({});
    setRawHeaders([]);
    setImporting(false);
    setDone(null);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? '';
      const rows = parseCSV(text);
      if (rows.length < 2) { alert('CSV must have a header row and at least one data row.'); return; }

      const headers = rows[0];
      setRawHeaders(headers);

      const autoMap: Record<number, string> = {};
      headers.forEach((h, idx) => {
        const normalized = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = config.expectedHeaders.find(
          eh => eh.csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized,
        );
        if (match) autoMap[idx] = match.fieldKey;
      });
      setHeaderMap(autoMap);

      const results: ImportRowResult[] = [];
      for (let r = 1; r < rows.length; r++) {
        const cells = rows[r];
        const data: Record<string, string> = {};
        headers.forEach((_, idx) => {
          const field = autoMap[idx];
          if (field) data[field] = cells[idx] ?? '';
        });

        let error: string | null = null;
        let status: ImportRowResult['status'] = 'valid';

        for (const eh of config.expectedHeaders) {
          if (eh.required && !data[eh.fieldKey]?.trim()) {
            error = `Missing required field: ${eh.csvHeader}`;
            status = 'error';
            break;
          }
        }

        if (!error && config.duplicateField && config.existingValues) {
          const dupVal = data[config.duplicateField]?.trim().toLowerCase();
          if (dupVal && config.existingValues.has(dupVal)) {
            if (config.duplicatePolicy === 'fail') {
              error = `Duplicate: ${dupVal}`;
              status = 'error';
            } else if (config.duplicatePolicy === 'skip') {
              status = 'duplicate';
            } else {
              status = 'duplicate';
            }
          }
        }

        if (!error && config.validate) {
          error = config.validate(data);
          if (error) status = 'error';
        }

        results.push({ row: r + 1, data, error: error ?? undefined, status });
      }
      setPreview(results);
    };
    reader.readAsText(file);
  }

  async function handleConfirm() {
    if (!preview) return;
    setImporting(true);
    const validRows = preview
      .filter(r => r.status === 'valid' || (r.status === 'duplicate' && config.duplicatePolicy === 'update'))
      .map(r => r.data);
    try {
      await onConfirm(validRows);
      const skipped = preview.filter(r => r.status === 'duplicate' && config.duplicatePolicy === 'skip').length;
      const failed = preview.filter(r => r.status === 'error').length;
      setDone({ success: validRows.length, skipped, failed });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  const validCount = preview?.filter(r => r.status === 'valid').length ?? 0;
  const dupCount = preview?.filter(r => r.status === 'duplicate').length ?? 0;
  const errCount = preview?.filter(r => r.status === 'error').length ?? 0;

  return (
    <Modal isOpen={open} onClose={handleClose} title={`Import ${entityName}`} size="xl">
      {done ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-700">
            <strong>{done.success}</strong> imported
            {done.skipped > 0 && <>, <strong>{done.skipped}</strong> skipped (duplicate)</>}
            {done.failed > 0 && <>, <strong>{done.failed}</strong> failed</>}
          </p>
          <button onClick={handleClose} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Done
          </button>
        </div>
      ) : !preview ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a CSV with headers matching: <strong>{config.expectedHeaders.map(h => h.csvHeader).join(', ')}</strong>.
          </p>
          {config.duplicateField && (
            <p className="text-xs text-gray-500">
              Duplicate policy (<em>{config.duplicateField}</em>): <strong>{config.duplicatePolicy}</strong>
            </p>
          )}
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-8">
            <label className="cursor-pointer text-center">
              <svg className="mx-auto mb-2 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm font-medium text-blue-600">Choose CSV file</span>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              {validCount} valid
            </span>
            {dupCount > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                {dupCount} duplicate ({config.duplicatePolicy})
              </span>
            )}
            {errCount > 0 && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                {errCount} error
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-auto rounded-lg border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-2 py-1.5 font-medium text-gray-600">Row</th>
                  <th className="px-2 py-1.5 font-medium text-gray-600">Status</th>
                  {rawHeaders.map((h, i) => headerMap[i] && (
                    <th key={i} className="px-2 py-1.5 font-medium text-gray-600">{h}</th>
                  ))}
                  <th className="px-2 py-1.5 font-medium text-gray-600">Error</th>
                </tr>
              </thead>
              <tbody>
                {preview.map(r => (
                  <tr key={r.row} className={r.status === 'error' ? 'bg-red-50/50' : r.status === 'duplicate' ? 'bg-amber-50/50' : ''}>
                    <td className="px-2 py-1 text-gray-500">{r.row}</td>
                    <td className="px-2 py-1">
                      <span className={`inline-block h-2 w-2 rounded-full ${
                        r.status === 'valid' ? 'bg-green-500' : r.status === 'error' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                    </td>
                    {rawHeaders.map((_, i) => headerMap[i] && (
                      <td key={i} className="max-w-[160px] truncate px-2 py-1 text-gray-700">
                        {r.data[headerMap[i]] ?? ''}
                      </td>
                    ))}
                    <td className="px-2 py-1 text-red-600">{r.error ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={reset} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Re-upload
            </button>
            <button
              onClick={handleConfirm}
              disabled={importing || validCount === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {importing ? 'Importing…' : `Import ${validCount} row${validCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default ImportDialog;
