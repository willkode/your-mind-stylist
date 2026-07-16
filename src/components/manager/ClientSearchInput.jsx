import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, User, Mail } from "lucide-react";

export default function ClientSearchInput({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.toLowerCase();

        // Search leads, users, and past bookings in parallel
        const [leads, users, bookings] = await Promise.all([
          base44.entities.Lead.list('-created_date', 200),
          base44.entities.User.list('-created_date', 200),
          base44.entities.Booking.list('-created_date', 200),
        ]);

        const seen = new Set();
        const matches = [];

        // Users first
        users.forEach(u => {
          if ((u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) && !seen.has(u.email?.toLowerCase())) {
            seen.add(u.email?.toLowerCase());
            matches.push({
              name: u.full_name || u.email,
              email: u.email,
              phone: "",
              source: "User",
            });
          }
        });

        // Leads
        leads.forEach(l => {
          const email = l.email?.toLowerCase();
          if ((l.full_name?.toLowerCase().includes(q) || l.first_name?.toLowerCase().includes(q) || email?.includes(q)) && !seen.has(email)) {
            seen.add(email);
            matches.push({
              name: l.full_name || `${l.first_name || ''} ${l.last_name || ''}`.trim() || l.email,
              email: l.email,
              phone: l.phone || "",
              source: "Lead",
            });
          }
        });

        // Past bookings (for clients who may not be leads or users)
        bookings.forEach(b => {
          const email = b.user_email?.toLowerCase();
          if ((b.user_name?.toLowerCase().includes(q) || email?.includes(q)) && !seen.has(email)) {
            seen.add(email);
            matches.push({
              name: b.user_name || b.user_email,
              email: b.user_email,
              phone: b.client_phone || "",
              source: "Past Booking",
            });
          }
        });

        setResults(matches.slice(0, 8));
        setShowDropdown(matches.length > 0);
      } catch (err) {
        console.error("Client search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (client) => {
    onSelect(client);
    setQuery(client.name);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Label className="text-xs text-[#2B2725]/70">Search existing client</Label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) setShowDropdown(true);
          }}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search by name or email..."
          className="pl-9"
        />
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#E4D9C4] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((client, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(client)}
              className="w-full text-left px-4 py-3 hover:bg-[#F9F5EF] border-b border-[#E4D9C4]/50 last:border-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-[#D8B46B]" />
                  <span className="text-sm font-medium text-[#1E3A32]">{client.name}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#F9F5EF] text-[#2B2725]/60">{client.source}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 pl-6">
                <Mail size={10} className="text-[#2B2725]/40" />
                <span className="text-xs text-[#2B2725]/60">{client.email}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {loading && query.length >= 2 && (
        <p className="text-xs text-[#2B2725]/50 mt-1">Searching...</p>
      )}
      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-xs text-[#2B2725]/50 mt-1">No matches — enter details manually below</p>
      )}
    </div>
  );
}