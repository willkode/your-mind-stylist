import React, { useState } from "react";
import { Download, Headphones, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DownloadSection({ audiobook }) {
  const [showHelp, setShowHelp] = useState(false);
  const downloadUrl = audiobook.download_url || audiobook.audio_url;
  const fileSize = audiobook.file_size_mb ? `${audiobook.file_size_mb} MB` : null;
  const format = (audiobook.file_format || "mp3").toUpperCase();

  return (
    <div className="border-t border-[#E4D9C4] pt-6 mt-6">
      <div className="flex items-center gap-3 mb-3">
        <Headphones size={18} className="text-[#1E3A32]" />
        <h3 className="text-sm font-medium text-[#1E3A32]">Offline Listening</h3>
      </div>

      <p className="text-xs text-[#2B2725]/60 mb-1">
        Prefer to listen offline? Download the {format} file and play it in your favorite app.
      </p>
      <p className="text-xs text-[#2B2725]/40 mb-4 italic">
        Listen here directly, or download the audio file to listen on your preferred device.
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <a
          href={downloadUrl}
          download={`${audiobook.title || "audiobook"}.${(audiobook.file_format || "mp3").toLowerCase()}`}
          type={format === "MP3" ? "audio/mpeg" : format === "M4B" ? "audio/mp4" : format === "M4A" ? "audio/mp4" : "audio/mpeg"}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-colors rounded"
        >
          <Download size={16} />
          Download {format}
          {fileSize && <span className="text-[#F9F5EF]/60 text-xs">({fileSize})</span>}
        </a>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHelp(!showHelp)}
          className="text-xs text-[#2B2725]/50 hover:text-[#1E3A32] gap-1"
        >
          <HelpCircle size={14} />
          What can play this?
          {showHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </Button>
      </div>

      {showHelp && (
        <div className="mt-4 p-4 bg-[#F9F5EF] border border-[#E4D9C4] rounded-lg text-sm text-[#2B2725]/70 space-y-3">
          <p className="font-medium text-[#1E3A32] text-xs uppercase tracking-wider">Compatible Apps</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="font-medium text-[#1E3A32] text-sm mb-1">🍎 iPhone / iPad</p>
              <ul className="text-xs space-y-1 pl-5 list-disc">
                <li><strong>Apple Books</strong> — Import via "Open In" from Safari</li>
                <li><strong>Apple Music / Files</strong> — MP3 plays natively</li>
                <li><strong>Bound</strong> (free) — Audiobook app with chapter support</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#1E3A32] text-sm mb-1">🤖 Android</p>
              <ul className="text-xs space-y-1 pl-5 list-disc">
                <li><strong>Smart AudioBook Player</strong> (free) — Best for audiobooks</li>
                <li><strong>Samsung Music / Google Files</strong> — MP3 plays natively</li>
                <li><strong>VLC</strong> (free) — Universal media player</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#1E3A32] text-sm mb-1">💻 Computer</p>
              <ul className="text-xs space-y-1 pl-5 list-disc">
                <li><strong>VLC Media Player</strong> (free) — Works on Mac, Windows, Linux</li>
                <li><strong>Apple Music / iTunes</strong> — Mac & Windows</li>
                <li><strong>Any web browser</strong> — Just open the file</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#1E3A32] text-sm mb-1">💡 Pro Tip</p>
              <p className="text-xs">
                For the best audiobook experience with bookmarks and chapter navigation,
                we recommend <strong>Bound</strong> (iPhone) or <strong>Smart AudioBook Player</strong> (Android) — both free!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}