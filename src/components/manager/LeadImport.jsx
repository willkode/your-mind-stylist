import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function LeadImport({ open, onOpenChange, onSuccess }) {
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
          if (!item.email) {
            errors.push(`Skipped row: missing email`);
            continue;
          }

          const existing = await base44.entities.Lead.filter({ email: item.email });
          
          // Support full_name as a convenience column
          let firstName = item.first_name || '';
          let lastName = item.last_name || '';
          if (!firstName && !lastName && item.full_name) {
            const parts = item.full_name.trim().split(/\s+/);
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
          }

          const leadData = {
            email: item.email,
            first_name: firstName,
            last_name: lastName,
            phone: item.phone || '',
            address_line1: item.address_line1 || item.address || '',
            city: item.city || '',
            state: item.state || '',
            zip: item.zip || item.zip_code || item.postal_code || '',
            source: item.source || 'other',
            stage: item.stage || 'new',
            what_inquired_about: item.what_inquired_about || item.inquiry || '',
            what_they_bought: item.what_they_bought || item.purchased || '',
            date_of_purchase: item.date_of_purchase || '',
            follow_up_actions: item.follow_up_actions || item.follow_up || '',
            notes: item.notes || '',
            tags: item.tags ? item.tags.split(';').map(t => t.trim()).filter(Boolean) : [],
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

      setResults({ total: importData.length, created, updated, errors, success: errors.length === 0 });

      if (errors.length === 0) {
        toast.success(`Successfully imported ${created} new leads and updated ${updated} existing!`);
        setTimeout(() => onSuccess(), 2000);
      } else {
        toast.error(`Import completed with ${errors.length} errors.`);
      }
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
      setResults({ total: 0, created: 0, updated: 0, errors: [error.message], success: false });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvTemplate = `email,first_name,last_name,phone,address_line1,city,state,zip,source,stage,what_inquired_about,what_they_bought,date_of_purchase,follow_up_actions,notes,tags
john@example.com,John,Doe,+1234567890,123 Main St,Las Vegas,NV,89148,networking,new,Hypnosis Training,,,Follow up next week,Great referral from Sarah,VIP;speaker`;
    
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-[#1E3A32] mb-2">Step 1: Download Template</h3>
          <p className="text-sm text-[#2B2725]/70 mb-3">
            Download the CSV template, fill it in, and upload. Only <strong>email</strong> is required — all other columns are optional.
          </p>
          <Button size="sm" variant="outline" onClick={downloadTemplate}>
            <Download size={14} className="mr-2" />
            Download CSV Template
          </Button>
        </div>

          <div>
            <h3 className="font-medium text-[#1E3A32] mb-2">Step 2: CSV Column Headers</h3>
            <p className="text-sm text-[#2B2725]/70 mb-3">
              Your CSV's first row must contain column headers. Use the exact names below. Only <strong>email</strong> is required — include whichever other columns you have.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-[#E4D9C4] rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#1E3A32] text-[#F9F5EF]">
                    <th className="text-left p-2 font-medium">Column Header</th>
                    <th className="text-left p-2 font-medium">Description</th>
                    <th className="text-left p-2 font-medium">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4D9C4]">
                  <tr className="bg-[#D8B46B]/10">
                    <td className="p-2 font-mono font-semibold text-[#1E3A32]">email <span className="text-red-600">*</span></td>
                    <td className="p-2 text-[#2B2725]/70">Email address (required)</td>
                    <td className="p-2 text-[#2B2725]/50">john@example.com</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-[#1E3A32]">first_name</td>
                    <td className="p-2 text-[#2B2725]/70">First name</td>
                    <td className="p-2 text-[#2B2725]/50">John</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-[#1E3A32]">last_name</td>
                    <td className="p-2 text-[#2B2725]/70">Last name</td>
                    <td className="p-2 text-[#2B2725]/50">Doe</td>
                  </tr>
                  <tr className="bg-[#F9F5EF]">
                    <td className="p-2 font-mono text-[#1E3A32]">full_name</td>
                    <td className="p-2 text-[#2B2725]/70">Full name (auto-splits into first/last if those columns are empty)</td>
                    <td className="p-2 text-[#2B2725]/50">John Doe</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-[#1E3A32]">phone</td>
                    <td className="p-2 text-[#2B2725]/70">Phone number</td>
                    <td className="p-2 text-[#2B2725]/50">+1234567890</td>
                  </tr>
                  <tr className="bg-[#F9F5EF]">
                    <td className="p-2 font-mono text-[#1E3A32]">address_line1</td>
                    <td className="p-2 text-[#2B2725]/70">Street address (also accepts <span className="font-mono">address</span>)</td>
                    <td className="p-2 text-[#2B2725]/50">123 Main St</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-[#1E3A32]">city</td>
                    <td className="p-2 text-[#2B2725]/70">City</td>
                    <td className="p-2 text-[#2B2725]/50">Las Vegas</td>
                  </tr>
                  <tr className="bg-[#F9F5EF]">
                    <td className="p-2 font-mono text-[#1E3A32]">state</td>
                    <td className="p-2 text-[#2B2725]/70">State / Province</td>
                    <td className="p-2 text-[#2B2725]/50">NV</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-[#1E3A32]">zip</td>
                    <td className="p-2 text-[#2B2725]/70">ZIP code (also accepts <span className="font-mono">zip_code</span> or <span className="font-mono">postal_code</span>)</td>
                    <td className="p-2 text-[#2B2725]/50">89148</td>
                  </tr>
                  <tr className="bg-[#F9F5EF]">
                    <td className="p-2 font-mono text-[#1E3A32]">source</td>
                    <td className="p-2 text-[#2B2725]/70">How they found you</td>
                    <td className="p-2 text-[#2B2725]/50">networking, referral, website, masterclass, social_media, event, other</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-[#1E3A32]">stage</td>
                    <td className="p-2 text-[#2B2725]/70">Pipeline stage (defaults to "new")</td>
                    <td className="p-2 text-[#2B2725]/50">new, contacted, booked, qualified, won, lost</td>
                  </tr>
                  <tr className="bg-[#F9F5EF]">
                    <td className="p-2 font-mono text-[#1E3A32]">what_inquired_about</td>
                    <td className="p-2 text-[#2B2725]/70">What they asked about (also accepts <span className="font-mono">inquiry</span>)</td>
                    <td className="p-2 text-[#2B2725]/50">Hypnosis Training</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-[#1E3A32]">what_they_bought</td>
                    <td className="p-2 text-[#2B2725]/70">Products/services purchased (also accepts <span className="font-mono">purchased</span>)</td>
                    <td className="p-2 text-[#2B2725]/50">LENS™ Certification</td>
                  </tr>
                  <tr className="bg-[#F9F5EF]">
                    <td className="p-2 font-mono text-[#1E3A32]">date_of_purchase</td>
                    <td className="p-2 text-[#2B2725]/70">Purchase date (YYYY-MM-DD)</td>
                    <td className="p-2 text-[#2B2725]/50">2026-01-15</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-[#1E3A32]">follow_up_actions</td>
                    <td className="p-2 text-[#2B2725]/70">Follow-up notes (also accepts <span className="font-mono">follow_up</span>)</td>
                    <td className="p-2 text-[#2B2725]/50">Call next week</td>
                  </tr>
                  <tr className="bg-[#F9F5EF]">
                    <td className="p-2 font-mono text-[#1E3A32]">notes</td>
                    <td className="p-2 text-[#2B2725]/70">Internal notes</td>
                    <td className="p-2 text-[#2B2725]/50">Great referral from Sarah</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-[#1E3A32]">tags</td>
                    <td className="p-2 text-[#2B2725]/70">Tags separated by semicolons</td>
                    <td className="p-2 text-[#2B2725]/50">VIP;speaker;2026-cohort</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-[#2B2725]/50 mt-2">
              Tip: If a contact's email already exists, their record will be updated instead of duplicated.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[#1E3A32] mb-2">Step 3: Upload File</h3>
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
              {importing ? "Importing..." : "Upload CSV or JSON"}
            </Button>
          </div>

          {results && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                {results.success ? (
                  <>
                    <CheckCircle2 className="text-green-600" size={20} />
                    <h3 className="font-medium text-green-700">Import Successful!</h3>
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-yellow-600" size={20} />
                    <h3 className="font-medium text-yellow-700">Import Completed with Issues</h3>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-[#F9F5EF] p-3 rounded">
                  <p className="text-xs text-[#2B2725]/60">Total</p>
                  <p className="text-xl font-bold">{results.total}</p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-xs text-[#2B2725]/60">New</p>
                  <p className="text-xl font-bold text-green-700">{results.created}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-[#2B2725]/60">Updated</p>
                  <p className="text-xl font-bold text-blue-700">{results.updated}</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                  <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                  {results.errors.map((error, i) => (
                    <p key={i} className="text-xs text-red-700">• {error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}