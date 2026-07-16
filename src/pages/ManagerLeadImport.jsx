import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import toast from "react-hot-toast";

export default function ManagerLeadImport() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setResults(null);

    try {
      const text = await file.text();
      let importData = [];

      if (file.name.endsWith('.json')) {
        importData = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        importData = lines.slice(1).map(line => {
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
          const obj = {};
          headers.forEach((header, i) => {
            let value = values[i]?.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
            obj[header] = value || '';
          });
          return obj;
        });
      }

      let created = 0;
      let updated = 0;
      let errors = [];

      for (const item of importData) {
        try {
          // Required fields validation
          if (!item.email) {
            errors.push(`Skipped row: missing email`);
            continue;
          }

          // Check if lead exists
          const existing = await base44.entities.Lead.filter({ email: item.email });
          
          const leadData = {
            email: item.email,
            full_name: item.full_name || item.name || '',
            phone: item.phone || '',
            source: item.source || 'import',
            stage: item.stage || 'new',
            interest_level: item.interest_level || 'warm',
            lead_score: parseInt(item.lead_score) || 50,
            notes: item.notes || '',
            tags: item.tags ? (typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()) : item.tags) : [],
          };

          if (existing.length > 0) {
            await base44.entities.Lead.update(existing[0].id, leadData);
            updated++;
          } else {
            await base44.entities.Lead.create(leadData);
            created++;
          }
        } catch (error) {
          errors.push(`Failed to import ${item.email}: ${error.message}`);
        }
      }

      setResults({
        total: importData.length,
        created,
        updated,
        errors,
        success: errors.length === 0,
      });

      if (errors.length === 0) {
        toast.success(`Successfully imported ${created} new leads and updated ${updated} existing leads!`);
      } else {
        toast.error(`Import completed with ${errors.length} errors. Check details below.`);
      }
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
      setResults({
        total: 0,
        created: 0,
        updated: 0,
        errors: [error.message],
        success: false,
      });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvTemplate = `email,full_name,phone,source,stage,interest_level,lead_score,tags,notes
example@email.com,John Doe,+1234567890,kajabi,new,warm,75,"tag1,tag2",Sample notes here`;
    
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lead-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("ManagerCRM"))}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to CRM
        </Button>

        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Import Leads</h1>
          <p className="text-[#2B2725]/70">Import leads from Kajabi or other sources via CSV or JSON</p>
        </div>

        {/* Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How to Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-[#1E3A32] mb-2">Step 1: Download Template</h3>
              <p className="text-sm text-[#2B2725]/70 mb-3">
                Download our CSV template to see the required format
              </p>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download size={16} className="mr-2" />
                Download Template
              </Button>
            </div>

            <div>
              <h3 className="font-medium text-[#1E3A32] mb-2">Step 2: Prepare Your Data</h3>
              <p className="text-sm text-[#2B2725]/70 mb-2">
                Export your leads from Kajabi (or other platform) as CSV, then format to match template:
              </p>
              <ul className="text-sm text-[#2B2725]/70 list-disc list-inside space-y-1">
                <li><strong>email</strong> (required): Lead's email address</li>
                <li><strong>full_name</strong>: Full name</li>
                <li><strong>phone</strong>: Phone number</li>
                <li><strong>source</strong>: Where they came from (e.g., "kajabi", "website", "referral")</li>
                <li><strong>stage</strong>: Pipeline stage (new, contacted, qualified, proposal, won, lost)</li>
                <li><strong>interest_level</strong>: cold, warm, or hot</li>
                <li><strong>lead_score</strong>: Number 0-100</li>
                <li><strong>tags</strong>: Comma-separated tags</li>
                <li><strong>notes</strong>: Any notes about the lead</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-[#1E3A32] mb-2">Step 3: Upload File</h3>
              <p className="text-sm text-[#2B2725]/70 mb-3">
                Upload your CSV or JSON file. Existing leads (matched by email) will be updated.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="bg-[#1E3A32] hover:bg-[#2B2725]"
              >
                <Upload size={16} className={`mr-2 ${importing ? "animate-pulse" : ""}`} />
                {importing ? "Importing..." : "Upload & Import"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.success ? (
                  <>
                    <CheckCircle2 className="text-green-600" />
                    Import Successful
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-yellow-600" />
                    Import Completed with Issues
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-[#F9F5EF] p-4 rounded-lg">
                  <p className="text-sm text-[#2B2725]/60 mb-1">Total Processed</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">{results.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-[#2B2725]/60 mb-1">New Leads Created</p>
                  <p className="text-2xl font-bold text-green-700">{results.created}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-[#2B2725]/60 mb-1">Existing Updated</p>
                  <p className="text-2xl font-bold text-blue-700">{results.updated}</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div>
                  <h3 className="font-medium text-[#1E3A32] mb-2">Errors ({results.errors.length})</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-800 mb-1">• {error}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => navigate(createPageUrl("ManagerCRM"))}
                  className="bg-[#1E3A32] hover:bg-[#2B2725]"
                >
                  Go to CRM
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setResults(null)}
                >
                  Import More
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}