import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ChevronRight, ChevronLeft, Download, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseRow(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });

  return { headers, rows };
}

const STEPS = ['Upload CSV', 'Map Columns', 'Map Courses', 'Preview', 'Import'];

export default function KajabiImportModal({ open, onOpenChange, onSuccess }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [csvData, setCsvData] = useState(null);
  const [columnMap, setColumnMap] = useState({ email: '', firstName: '', lastName: '', courseColumns: [] });
  const [courseMapping, setCourseMapping] = useState({});
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const { data: appCourses = [] } = useQuery({
    queryKey: ["coursesForKajabiImport"],
    queryFn: () => base44.entities.Course.filter({ status: "published" }),
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      if (parsed.rows.length === 0) { toast.error("CSV appears to be empty or invalid"); return; }
      setCsvData(parsed);
      setColumnMap({
        email: parsed.headers.find(h => h.toLowerCase().includes('email')) || '',
        firstName: parsed.headers.find(h => h.toLowerCase().includes('first')) || '',
        lastName: parsed.headers.find(h => h.toLowerCase().includes('last')) || '',
        courseColumns: [],
      });
      setStep(1);
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const sample = `Email,First Name,Last Name,Products\ntest1@example.com,Jane,Smith,LENS Certification\ntest2@example.com,Bob,Jones,"LENS Certification,Inner Rehearsal"\ntest3@example.com,Alice,Brown,Inner Rehearsal`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'kajabi_sample.csv'; a.click();
  };

  const getKajabiCourseNames = () => {
    if (!csvData || columnMap.courseColumns.length === 0) return [];
    const names = new Set();
    csvData.rows.forEach(row => {
      columnMap.courseColumns.forEach(col => {
        const val = row[col] || '';
        if (val.toLowerCase() === 'true') {
          names.add(col);
        } else if (val && val.toLowerCase() !== 'false') {
          val.split(',').forEach(v => { const t = v.trim(); if (t) names.add(t); });
        }
      });
    });
    return [...names];
  };

  const getPreviewUsers = () => {
    if (!csvData) return [];
    return csvData.rows.map(row => {
      const email = (row[columnMap.email] || '').trim();
      const firstName = (row[columnMap.firstName] || '').trim();
      const lastName = (row[columnMap.lastName] || '').trim();
      const kajabiCourses = [];
      columnMap.courseColumns.forEach(col => {
        const val = row[col] || '';
        if (val.toLowerCase() === 'true') { kajabiCourses.push(col); }
        else if (val && val.toLowerCase() !== 'false') {
          val.split(',').forEach(v => { const t = v.trim(); if (t) kajabiCourses.push(t); });
        }
      });
      const appCourseIds = kajabiCourses.map(k => courseMapping[k]).filter(Boolean);
      return { email, firstName, lastName, kajabiCourses, appCourseIds };
    }).filter(u => u.email);
  };

  const handleImport = async () => {
    const users = getPreviewUsers();
    if (users.length === 0) { toast.error("No valid users to import"); return; }
    setImporting(true);
    try {
      const response = await base44.functions.invoke("bulkImportKajabiUsers", { users });
      setImportResults(response.data);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setStep(4);
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setStep(0); setCsvData(null); setImportResults(null);
    setColumnMap({ email: '', firstName: '', lastName: '', courseColumns: [] });
    setCourseMapping({});
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const kajabiCourseNames = getKajabiCourseNames();
  const previewUsers = step >= 3 ? getPreviewUsers() : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from Kajabi</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center overflow-x-auto pb-2 gap-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1 whitespace-nowrap text-xs ${i <= step ? 'text-[#1E3A32]' : 'text-[#2B2725]/40'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i < step ? 'bg-[#1E3A32] text-white' : i === step ? 'bg-[#D8B46B] text-white' : 'bg-[#E4D9C4] text-[#2B2725]/40'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px min-w-[8px] ${i < step ? 'bg-[#1E3A32]' : 'bg-[#E4D9C4]'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-4">

          {/* Step 0: Upload */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg text-[#1E3A32] mb-1">Upload your Kajabi CSV</h3>
                <p className="text-xs text-[#2B2725]/70">
                  In Kajabi, go to <strong>People → Export</strong> to download your member list.
                </p>
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D8B46B]/50 rounded-lg p-8 text-center cursor-pointer hover:border-[#D8B46B] hover:bg-[#F9F5EF]/50 transition-all"
              >
                <Upload size={32} className="mx-auto text-[#D8B46B] mb-2" />
                <p className="font-medium text-[#1E3A32] text-sm mb-1">Click to upload CSV</p>
                <p className="text-xs text-[#2B2725]/60">Kajabi members export (.csv)</p>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </div>
              <div className="flex items-center gap-2 p-3 bg-[#F9F5EF] rounded text-xs text-[#2B2725]/70">
                <Download size={14} className="text-[#1E3A32] flex-shrink-0" />
                <button onClick={downloadSampleCSV} className="text-[#1E3A32] underline font-medium">Download sample CSV</button>
              </div>
            </div>
          )}

          {/* Step 1: Map Columns */}
          {step === 1 && csvData && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg text-[#1E3A32] mb-1">Map your CSV columns</h3>
                <p className="text-xs text-[#2B2725]/70">Found <strong>{csvData.rows.length} rows</strong>. Tell us which columns map to what.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[{ label: 'Email *', key: 'email' }, { label: 'First Name', key: 'firstName' }, { label: 'Last Name', key: 'lastName' }].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-[#2B2725] block mb-1">{label}</label>
                    <Select value={columnMap[key]} onValueChange={(v) => setColumnMap(p => ({ ...p, [key]: v }))}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>— None —</SelectItem>
                        {csvData.headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-[#2B2725] block mb-2">
                  Course / Product columns <span className="font-normal text-[#2B2725]/50">(check all that contain course info)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {csvData.headers.map(h => (
                    <label key={h} className="flex items-center gap-2 p-2 rounded border border-[#E4D9C4] cursor-pointer hover:bg-[#F9F5EF] text-xs">
                      <input
                        type="checkbox"
                        checked={columnMap.courseColumns.includes(h)}
                        onChange={(e) => setColumnMap(p => ({ ...p, courseColumns: e.target.checked ? [...p.courseColumns, h] : p.courseColumns.filter(c => c !== h) }))}
                      />
                      <span className="truncate">{h}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Map Courses */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg text-[#1E3A32] mb-1">Map Kajabi → App Courses</h3>
                <p className="text-xs text-[#2B2725]/70">
                  Found <strong>{kajabiCourseNames.length} unique course names</strong>. Match each one to the equivalent course.
                </p>
              </div>

              {kajabiCourseNames.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  No course names detected. Go back and select the correct columns.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {kajabiCourseNames.map(kajabiName => (
                    <div key={kajabiName} className="flex items-center gap-2 p-3 border border-[#E4D9C4] rounded bg-[#F9F5EF]/40">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#2B2725] truncate">{kajabiName}</p>
                      </div>
                      <ArrowRight size={14} className="text-[#D8B46B] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Select value={courseMapping[kajabiName] || ''} onValueChange={(v) => setCourseMapping(p => ({ ...p, [kajabiName]: v }))}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={null}>— Skip —</SelectItem>
                            {appCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg text-[#1E3A32] mb-1">Preview Import</h3>
                <p className="text-xs text-[#2B2725]/70">
                  <strong>{previewUsers.length} users</strong> ready to import and convert to platform users.
                </p>
              </div>

              <div className="overflow-auto rounded border border-[#E4D9C4] max-h-48">
                <table className="w-full text-xs">
                  <thead className="bg-[#F9F5EF] sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-[#2B2725]">Name</th>
                      <th className="px-2 py-2 text-left font-medium text-[#2B2725]">Email</th>
                      <th className="px-2 py-2 text-left font-medium text-[#2B2725]">Courses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4D9C4]">
                    {previewUsers.map((u, i) => (
                      <tr key={i} className="hover:bg-[#F9F5EF]/50">
                        <td className="px-2 py-2 font-medium text-[#1E3A32]">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</td>
                        <td className="px-2 py-2 text-[#2B2725]/70">{u.email}</td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-1">
                            {u.appCourseIds.length > 0
                              ? u.appCourseIds.map(cid => {
                                  const course = appCourses.find(c => c.id === cid);
                                  return <span key={cid} className="px-1.5 py-0.5 bg-[#1E3A32]/10 text-[#1E3A32] text-xs rounded">{course?.title?.slice(0, 20)}</span>;
                                })
                              : <span className="text-[#2B2725]/40 text-xs italic">No courses</span>
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
                ✉️ Each user will be <strong>invited to the platform</strong> and <strong>enrolled in their mapped courses</strong>.
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && importResults && (
            <div className="space-y-4 text-center">
              <CheckCircle size={40} className="mx-auto text-green-500" />
              <div>
                <h3 className="font-serif text-lg text-[#1E3A32] mb-1">Import Complete!</h3>
                <p className="text-xs text-[#2B2725]/70">Your Kajabi members are now users on the platform.</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded text-center">
                  <p className="text-2xl font-bold text-green-700">{importResults.invited ?? 0}</p>
                  <p className="text-xs text-green-600 mt-1">Users Invited</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-center">
                  <p className="text-2xl font-bold text-blue-700">{importResults.enrolled ?? 0}</p>
                  <p className="text-xs text-blue-600 mt-1">Enrollments</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-center">
                  <p className="text-2xl font-bold text-amber-700">{importResults.skipped ?? 0}</p>
                  <p className="text-xs text-amber-600 mt-1">Skipped</p>
                </div>
              </div>

              {importResults.errors?.length > 0 && (
                <div className="text-left p-3 bg-red-50 border border-red-200 rounded text-xs max-h-32 overflow-y-auto">
                  <p className="font-medium text-red-800 mb-1">Issues:</p>
                  <ul className="space-y-0.5 text-red-700">
                    {importResults.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-[#E4D9C4]">
          <Button variant="outline" size="sm" onClick={() => step === 0 ? handleClose() : setStep(step - 1)}>
            <ChevronLeft size={14} className="mr-1" /> {step === 0 ? 'Close' : 'Back'}
          </Button>

          {step < 4 && (
            <Button
              size="sm"
              onClick={() => {
                if (step === 3) handleImport();
                else setStep(step + 1);
              }}
              disabled={step === 1 ? !columnMap.email : step === 3 ? importing || previewUsers.length === 0 : false}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
            >
              {step === 3 && importing ? (
                <><Loader2 size={14} className="mr-1 animate-spin" /> Importing...</>
              ) : (
                <>
                  {step === 3 ? 'Import Users' : 'Next'} <ChevronRight size={14} className="ml-1" />
                </>
              )}
            </Button>
          )}

          {step === 4 && (
            <Button size="sm" onClick={handleClose} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}