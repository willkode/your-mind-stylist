import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ChevronRight, ChevronLeft, Download, CheckCircle, ArrowRight, Loader2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import toast from "react-hot-toast";

// Simple robust CSV parser
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

export default function KajabiImport() {
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
        // Handle TRUE/FALSE boolean columns (column name IS the course name)
        if (val.toLowerCase() === 'true') {
          names.add(col);
        } else if (val && val.toLowerCase() !== 'false') {
          // Handle comma-separated product names in a single cell
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

  const kajabiCourseNames = getKajabiCourseNames();
  const previewUsers = step >= 3 ? getPreviewUsers() : [];

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Kajabi Import Wizard</h1>
            <p className="text-[#2B2725]/70">Import your Kajabi members and map their courses to this platform</p>
          </div>
          <Link to={createPageUrl("AdminUsers")}>
            <Button variant="outline" size="sm"><Users size={14} className="mr-2" /> Back to Users</Button>
          </Link>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 whitespace-nowrap ${i <= step ? 'text-[#1E3A32]' : 'text-[#2B2725]/40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i < step ? 'bg-[#1E3A32] text-white' : i === step ? 'bg-[#D8B46B] text-white' : 'bg-[#E4D9C4] text-[#2B2725]/40'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-sm font-medium">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 min-w-[16px] ${i < step ? 'bg-[#1E3A32]' : 'bg-[#E4D9C4]'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm">

          {/* Step 0: Upload */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1E3A32] mb-2">Upload your Kajabi CSV</h2>
                <p className="text-sm text-[#2B2725]/70">
                  In Kajabi, go to <strong>People → Export</strong> to download your member list. The file should include names, emails, and the products each person has access to.
                </p>
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D8B46B]/50 rounded-xl p-16 text-center cursor-pointer hover:border-[#D8B46B] hover:bg-[#F9F5EF]/50 transition-all"
              >
                <Upload size={44} className="mx-auto text-[#D8B46B] mb-3" />
                <p className="font-medium text-[#1E3A32] text-lg mb-1">Click to upload CSV</p>
                <p className="text-sm text-[#2B2725]/60">Kajabi members export (.csv)</p>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#F9F5EF] rounded-lg text-sm text-[#2B2725]/70">
                <Download size={16} className="text-[#1E3A32] flex-shrink-0" />
                <span>Not sure about the CSV format?</span>
                <button onClick={downloadSampleCSV} className="text-[#1E3A32] underline font-medium">Download sample CSV</button>
              </div>
            </div>
          )}

          {/* Step 1: Map Columns */}
          {step === 1 && csvData && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1E3A32] mb-1">Map your CSV columns</h2>
                <p className="text-sm text-[#2B2725]/70">Found <strong>{csvData.rows.length} rows</strong>. Tell us which columns map to what.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[{ label: 'Email column *', key: 'email' }, { label: 'First Name', key: 'firstName' }, { label: 'Last Name', key: 'lastName' }].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-[#2B2725] block mb-1">{label}</label>
                    <Select value={columnMap[key]} onValueChange={(v) => setColumnMap(p => ({ ...p, [key]: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select column..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>— None —</SelectItem>
                        {csvData.headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium text-[#2B2725] block mb-1">
                  Course / Product columns <span className="font-normal text-[#2B2725]/50">(check all that contain course info)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {csvData.headers.map(h => (
                    <label key={h} className="flex items-center gap-2 p-3 rounded-lg border border-[#E4D9C4] cursor-pointer hover:bg-[#F9F5EF] text-sm">
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

              {/* CSV Preview */}
              <div>
                <p className="text-xs text-[#2B2725]/50 mb-2">Preview (first 3 rows):</p>
                <div className="overflow-x-auto rounded-lg border border-[#E4D9C4]">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F9F5EF]">
                      <tr>{csvData.headers.map(h => <th key={h} className="px-3 py-2 text-left font-medium text-[#2B2725] whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {csvData.rows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-t border-[#E4D9C4]">
                          {csvData.headers.map(h => <td key={h} className="px-3 py-2 text-[#2B2725]/70 max-w-[120px] truncate">{row[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#E4D9C4]">
                <Button variant="outline" onClick={() => setStep(0)}><ChevronLeft size={16} className="mr-1" /> Back</Button>
                <Button onClick={() => setStep(2)} disabled={!columnMap.email} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
                  Next <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Map Courses */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1E3A32] mb-1">Map Kajabi → App Courses</h2>
                <p className="text-sm text-[#2B2725]/70">
                  Found <strong>{kajabiCourseNames.length} unique course names</strong> in your Kajabi export. Match each one to the equivalent course in this platform (since they may have been renamed).
                </p>
              </div>

              {kajabiCourseNames.length === 0 ? (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  No course names detected. Go back and make sure you selected the correct course/product columns.
                </div>
              ) : (
                <div className="space-y-3">
                  {kajabiCourseNames.map(kajabiName => (
                    <div key={kajabiName} className="flex items-center gap-4 p-4 border border-[#E4D9C4] rounded-lg bg-[#F9F5EF]/40">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2B2725]">{kajabiName}</p>
                        <p className="text-xs text-[#2B2725]/50 mt-0.5">Kajabi name</p>
                      </div>
                      <ArrowRight size={18} className="text-[#D8B46B] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Select value={courseMapping[kajabiName] || ''} onValueChange={(v) => setCourseMapping(p => ({ ...p, [kajabiName]: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select app course..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={null}>— Skip this course —</SelectItem>
                            {appCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-[#E4D9C4]">
                <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft size={16} className="mr-1" /> Back</Button>
                <Button onClick={() => setStep(3)} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
                  Preview <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1E3A32] mb-1">Preview Import</h2>
                <p className="text-sm text-[#2B2725]/70">
                  <strong>{previewUsers.length} users</strong> ready to import. Each will receive an invitation + enrollment notification email.
                </p>
              </div>

              <div className="overflow-auto rounded-lg border border-[#E4D9C4] max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-[#F9F5EF] sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-[#2B2725]">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-[#2B2725]">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-[#2B2725]">Courses to Enroll</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4D9C4]">
                    {previewUsers.map((u, i) => (
                      <tr key={i} className="hover:bg-[#F9F5EF]/50">
                        <td className="px-4 py-3 font-medium text-[#1E3A32]">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</td>
                        <td className="px-4 py-3 text-[#2B2725]/70 text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.appCourseIds.length > 0
                              ? u.appCourseIds.map(cid => {
                                  const course = appCourses.find(c => c.id === cid);
                                  return <span key={cid} className="px-2 py-0.5 bg-[#1E3A32]/10 text-[#1E3A32] text-xs rounded">{course?.title || cid}</span>;
                                })
                              : <span className="text-[#2B2725]/40 text-xs italic">No courses mapped</span>
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                ✉️ Each user will receive an <strong>invitation email</strong> to join the platform, and a separate <strong>enrollment notification</strong> for each course they're assigned to.
              </div>

              <div className="flex justify-between pt-4 border-t border-[#E4D9C4]">
                <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft size={16} className="mr-1" /> Back</Button>
                <Button onClick={handleImport} disabled={importing || previewUsers.length === 0} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
                  {importing
                    ? <><Loader2 size={16} className="mr-2 animate-spin" /> Importing... this may take a minute</>
                    : <>Import {previewUsers.length} Users</>
                  }
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && importResults && (
            <div className="space-y-6 text-center">
              <CheckCircle size={56} className="mx-auto text-green-500" />
              <div>
                <h2 className="font-serif text-2xl text-[#1E3A32] mb-2">Import Complete!</h2>
                <p className="text-[#2B2725]/70">Your Kajabi members have been imported successfully.</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-left">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-700">{importResults.invited ?? 0}</p>
                  <p className="text-xs text-green-600 mt-1">Users Invited</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-700">{importResults.enrolled ?? 0}</p>
                  <p className="text-xs text-blue-600 mt-1">Course Enrollments</p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                  <p className="text-3xl font-bold text-amber-700">{importResults.skipped ?? 0}</p>
                  <p className="text-xs text-amber-600 mt-1">Skipped / Errors</p>
                </div>
              </div>

              {importResults.errors?.length > 0 && (
                <div className="text-left p-4 bg-red-50 border border-red-200 rounded-lg text-sm max-h-48 overflow-y-auto">
                  <p className="font-medium text-red-800 mb-2">Issues encountered:</p>
                  <ul className="space-y-1 text-red-700">
                    {importResults.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex justify-center gap-3 pt-4">
                <Button variant="outline" onClick={handleReset}>Import Another File</Button>
                <Link to={createPageUrl("AdminUsers")}>
                  <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">View Users</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}