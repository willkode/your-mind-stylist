import React from "react";
import { BookOpen, Music, FileAudio, Upload, List, CheckCircle2 } from "lucide-react";

export default function AudiobookSetupGuide() {
  return (
    <div className="space-y-8 text-[#2B2725]/80 text-sm leading-relaxed">

      {/* Overview */}
      <section>
        <h3 className="font-serif text-lg text-[#1E3A32] mb-2 flex items-center gap-2">
          <BookOpen size={18} className="text-[#D8B46B]" />
          What This Does
        </h3>
        <p>
          The Audiobook Player lets your clients listen to your audiobooks directly in their web browser —
          no app download needed. It works on iPhones, Android phones, tablets, and computers.
          Clients can pause, resume where they left off, jump to chapters, and adjust playback speed.
        </p>
        <p className="mt-2">
          You also have the option to offer a downloadable file for clients who prefer offline listening in
          their favorite app (Apple Books, VLC, etc.).
        </p>
      </section>

      {/* Step 1: Preparing Your Audio */}
      <section>
        <h3 className="font-serif text-lg text-[#1E3A32] mb-2 flex items-center gap-2">
          <Music size={18} className="text-[#D8B46B]" />
          Step 1: Prepare Your Audio File
        </h3>

        <div className="bg-[#F9F5EF] p-4 rounded-lg border border-[#E4D9C4] space-y-3">
          <p className="font-medium text-[#1E3A32]">Recommended Format: MP3</p>
          <p>
            <strong>MP3</strong> is the most universally compatible format. It plays in every browser,
            every phone, and every app. We recommend exporting your audiobook as a <strong>single MP3 file</strong>.
          </p>

          <div className="border-t border-[#E4D9C4] pt-3 mt-3">
            <p className="font-medium text-[#1E3A32] text-xs uppercase tracking-wider mb-2">Recommended Export Settings</p>
            <ul className="space-y-1 pl-5 list-disc text-xs">
              <li><strong>Format:</strong> MP3</li>
              <li><strong>Bitrate:</strong> 64 kbps (narration) or 128 kbps (if includes music)</li>
              <li><strong>Sample Rate:</strong> 44,100 Hz</li>
              <li><strong>Channels:</strong> Mono (spoken word) — reduces file size by ~50%</li>
              <li><strong>Target size:</strong> ~30 MB per hour at 64 kbps mono</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="font-medium text-[#1E3A32]">Software You Can Use:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded border border-[#E4D9C4]">
              <p className="font-medium text-sm text-[#1E3A32]">Audio Book Builder (Mac)</p>
              <p className="text-xs text-[#2B2725]/60">
                You already have this! Export as MP3 instead of M4B for best web compatibility.
                Go to <em>File → Export → MP3</em>.
              </p>
            </div>
            <div className="p-3 bg-white rounded border border-[#E4D9C4]">
              <p className="font-medium text-sm text-[#1E3A32]">Audacity (Free — Mac/Windows)</p>
              <p className="text-xs text-[#2B2725]/60">
                Open your audio → <em>File → Export → Export as MP3</em>. Choose 64 kbps for narration.
                <br />
                <a href="https://www.audacityteam.org" target="_blank" rel="noopener" className="text-[#D8B46B] hover:underline">
                  audacityteam.org
                </a>
              </p>
            </div>
            <div className="p-3 bg-white rounded border border-[#E4D9C4]">
              <p className="font-medium text-sm text-[#1E3A32]">GarageBand (Free — Mac)</p>
              <p className="text-xs text-[#2B2725]/60">
                <em>Share → Export Song to Disk → MP3</em>. Simple and built into your Mac.
              </p>
            </div>
            <div className="p-3 bg-white rounded border border-[#E4D9C4]">
              <p className="font-medium text-sm text-[#1E3A32]">CloudConvert (Online)</p>
              <p className="text-xs text-[#2B2725]/60">
                Convert M4B → MP3 online. No software needed.
                <br />
                <a href="https://cloudconvert.com/m4b-to-mp3" target="_blank" rel="noopener" className="text-[#D8B46B] hover:underline">
                  cloudconvert.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2: Chapter Timestamps */}
      <section>
        <h3 className="font-serif text-lg text-[#1E3A32] mb-2 flex items-center gap-2">
          <List size={18} className="text-[#D8B46B]" />
          Step 2: Note Your Chapter Timestamps
        </h3>
        <p>
          Before uploading, open your audio file in any player and note the <strong>start time</strong> of each chapter.
          You'll enter these as chapter markers in the editor.
        </p>
        <div className="bg-[#F9F5EF] p-4 rounded-lg border border-[#E4D9C4] mt-3">
          <p className="font-medium text-[#1E3A32] text-xs uppercase tracking-wider mb-2">Example Chapter List</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#2B2725]/40">
                <td className="pb-1">Chapter</td>
                <td className="pb-1">Start Time</td>
                <td className="pb-1">Duration</td>
              </tr>
            </thead>
            <tbody className="text-[#2B2725]/70">
              <tr><td>Introduction</td><td>0:00</td><td>5:30</td></tr>
              <tr><td>Chapter 1: The Beginning</td><td>5:30</td><td>18:45</td></tr>
              <tr><td>Chapter 2: Going Deeper</td><td>24:15</td><td>22:10</td></tr>
              <tr><td>Chapter 3: Transformation</td><td>46:25</td><td>20:00</td></tr>
              <tr><td>Closing</td><td>1:06:25</td><td>8:35</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#2B2725]/50 mt-2">
          💡 Tip: Audio Book Builder shows chapter timestamps in its chapter list. You can copy them directly.
        </p>
      </section>

      {/* Step 3: Upload */}
      <section>
        <h3 className="font-serif text-lg text-[#1E3A32] mb-2 flex items-center gap-2">
          <Upload size={18} className="text-[#D8B46B]" />
          Step 3: Upload & Configure
        </h3>
        <ol className="space-y-2 pl-5 list-decimal">
          <li>Click <strong>"New Audiobook"</strong> in the manager</li>
          <li>Fill in the title, slug (URL-friendly name), and author</li>
          <li>Upload your MP3 file using the <strong>Upload</strong> button</li>
          <li>Upload a cover image (your book cover works great)</li>
          <li>Add chapters with their start times and durations</li>
          <li>Link to the <strong>Product</strong> that gates access (if not free)</li>
          <li>Set status to <strong>"Published"</strong> when ready</li>
        </ol>
      </section>

      {/* Step 4: Share */}
      <section>
        <h3 className="font-serif text-lg text-[#1E3A32] mb-2 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-[#A6B7A3]" />
          Step 4: Share with Clients
        </h3>
        <p>
          Once published, your audiobook is available at:
        </p>
        <div className="bg-[#1E3A32] text-[#F9F5EF] p-3 rounded font-mono text-xs mt-2">
          yourmindstylist.com/audiobook/your-slug-here
        </div>
        <p className="mt-3">
          Clients who purchased the linked product can access it automatically. You can also
          link to it from your Library page, product pages, or send the link directly in an email.
        </p>
      </section>

      {/* Troubleshooting */}
      <section className="border-t border-[#E4D9C4] pt-6">
        <h3 className="font-serif text-lg text-[#1E3A32] mb-2">Common Questions</h3>
        <div className="space-y-3">
          <div>
            <p className="font-medium text-[#1E3A32] text-sm">Can I use M4B files?</p>
            <p className="text-xs text-[#2B2725]/60">
              M4B is Apple's audiobook format. While it works in some browsers, MP3 has the widest compatibility.
              We recommend converting M4B to MP3 using CloudConvert or Audacity.
            </p>
          </div>
          <div>
            <p className="font-medium text-[#1E3A32] text-sm">How large can the file be?</p>
            <p className="text-xs text-[#2B2725]/60">
              There's no hard limit, but we recommend keeping it under 500 MB. A 4-hour audiobook at 64 kbps mono
              is approximately 120 MB — very manageable.
            </p>
          </div>
          <div>
            <p className="font-medium text-[#1E3A32] text-sm">What if a client can't play it in their browser?</p>
            <p className="text-xs text-[#2B2725]/60">
              The player includes a "Download" button with a guide showing compatible apps for every device.
              This covers the edge case where someone prefers offline listening.
            </p>
          </div>
          <div>
            <p className="font-medium text-[#1E3A32] text-sm">Do I need to split into separate chapter files?</p>
            <p className="text-xs text-[#2B2725]/60">
              No! Upload a single file and enter chapter timestamps. The player handles jumping
              between chapters automatically.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}