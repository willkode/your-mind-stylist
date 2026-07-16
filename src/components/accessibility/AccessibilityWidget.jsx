import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Type, Eye, Zap, Link as LinkIcon, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const STORAGE_KEY = "a11y_preferences";

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    fontSize: 100, // percentage
    contrastMode: "default",
    dyslexiaFont: false,
    lineSpacing: "normal",
    highlightLinks: false,
    reduceMotion: false,
  });

  // Load preferences on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        applyPreferences(parsed);
      } catch (e) {
        console.error("Error loading accessibility preferences", e);
      }
    }
  }, []);

  // Apply preferences to document
  const applyPreferences = (prefs) => {
    const root = document.documentElement;
    const body = document.body;

    // Font size
    root.style.fontSize = `${prefs.fontSize}%`;

    // Contrast mode
    body.classList.toggle("theme-contrast-high", prefs.contrastMode === "high");

    // Dyslexia font
    body.classList.toggle("font-dyslexia", prefs.dyslexiaFont);

    // Line spacing
    body.classList.toggle("line-spacing-increased", prefs.lineSpacing === "increased");

    // Highlight links
    body.classList.toggle("highlight-links", prefs.highlightLinks);

    // Reduce motion
    body.classList.toggle("reduce-motion", prefs.reduceMotion);
  };

  // Save preferences
  const savePreferences = (newPrefs) => {
    setPreferences(newPrefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    applyPreferences(newPrefs);
  };

  // Font size controls
  const increaseFontSize = () => {
    const newSize = Math.min(preferences.fontSize + 10, 150);
    savePreferences({ ...preferences, fontSize: newSize });
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(preferences.fontSize - 10, 80);
    savePreferences({ ...preferences, fontSize: newSize });
  };

  const resetFontSize = () => {
    savePreferences({ ...preferences, fontSize: 100 });
  };

  // Reset all
  const resetAll = () => {
    const defaults = {
      fontSize: 100,
      contrastMode: "default",
      dyslexiaFont: false,
      lineSpacing: "normal",
      highlightLinks: false,
      reduceMotion: false,
    };
    savePreferences(defaults);
  };

  // Trap focus when open
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B4A40] transition-all shadow-lg rounded-full"
        aria-label="Open accessibility options"
      >
        <Eye size={18} />
        <span className="hidden sm:inline">Accessibility</span>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 overflow-y-auto"
              role="dialog"
              aria-labelledby="a11y-title"
              aria-modal="true"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-[#E4D9C4] p-6 flex justify-between items-center">
                <h2 id="a11y-title" className="font-serif text-2xl text-[#1E3A32]">
                  Accessibility Options
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-[#F9F5EF] rounded transition-colors"
                  aria-label="Close accessibility options"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8">
                <p className="text-[#2B2725]/70 text-sm leading-relaxed">
                  Adjust how this site looks and feels to better support your needs. These
                  settings affect only your device.
                </p>

                {/* Font Size */}
                <div>
                  <Label className="text-[#1E3A32] mb-3 flex items-center gap-2">
                    <Type size={18} className="text-[#D8B46B]" />
                    Text Size
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={decreaseFontSize}
                      className="border-[#E4D9C4]"
                    >
                      A-
                    </Button>
                    <span className="text-[#2B2725] text-sm flex-1 text-center">
                      {preferences.fontSize}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={increaseFontSize}
                      className="border-[#E4D9C4]"
                    >
                      A+
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFontSize}
                      className="border-[#E4D9C4]"
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Contrast Mode */}
                <div>
                  <Label className="text-[#1E3A32] mb-3 flex items-center gap-2">
                    <Eye size={18} className="text-[#D8B46B]" />
                    Contrast Mode
                  </Label>
                  <RadioGroup
                    value={preferences.contrastMode}
                    onValueChange={(value) =>
                      savePreferences({ ...preferences, contrastMode: value })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="contrast-default" />
                      <Label htmlFor="contrast-default" className="font-normal cursor-pointer">
                        Default
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="contrast-high" />
                      <Label htmlFor="contrast-high" className="font-normal cursor-pointer">
                        High Contrast
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Dyslexia Font */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="dyslexia-font" className="text-[#1E3A32] cursor-pointer">
                    Dyslexia-Friendly Text
                  </Label>
                  <Switch
                    id="dyslexia-font"
                    checked={preferences.dyslexiaFont}
                    onCheckedChange={(checked) =>
                      savePreferences({ ...preferences, dyslexiaFont: checked })
                    }
                  />
                </div>

                {/* Line Spacing */}
                <div>
                  <Label className="text-[#1E3A32] mb-3 flex items-center gap-2">
                    <Minimize2 size={18} className="text-[#D8B46B]" />
                    Line Spacing
                  </Label>
                  <RadioGroup
                    value={preferences.lineSpacing}
                    onValueChange={(value) =>
                      savePreferences({ ...preferences, lineSpacing: value })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="spacing-normal" />
                      <Label htmlFor="spacing-normal" className="font-normal cursor-pointer">
                        Normal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="increased" id="spacing-increased" />
                      <Label htmlFor="spacing-increased" className="font-normal cursor-pointer">
                        Increased
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Highlight Links */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="highlight-links" className="text-[#1E3A32] cursor-pointer flex items-center gap-2">
                    <LinkIcon size={18} className="text-[#D8B46B]" />
                    Highlight Links
                  </Label>
                  <Switch
                    id="highlight-links"
                    checked={preferences.highlightLinks}
                    onCheckedChange={(checked) =>
                      savePreferences({ ...preferences, highlightLinks: checked })
                    }
                  />
                </div>

                {/* Reduce Motion */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="reduce-motion" className="text-[#1E3A32] cursor-pointer flex items-center gap-2">
                    <Zap size={18} className="text-[#D8B46B]" />
                    Reduce Motion
                  </Label>
                  <Switch
                    id="reduce-motion"
                    checked={preferences.reduceMotion}
                    onCheckedChange={(checked) =>
                      savePreferences({ ...preferences, reduceMotion: checked })
                    }
                  />
                </div>

                {/* Reset All */}
                <div className="pt-4 border-t border-[#E4D9C4]">
                  <Button
                    onClick={resetAll}
                    variant="outline"
                    className="w-full border-[#E4D9C4] hover:bg-[#F9F5EF]"
                  >
                    Reset All Settings
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Styles */}
      <style>{`
        /* High contrast mode */
        body.theme-contrast-high {
          color: #000000 !important;
          background-color: #FFFFFF !important;
        }
        
        body.theme-contrast-high h1,
        body.theme-contrast-high h2,
        body.theme-contrast-high h3,
        body.theme-contrast-high h4,
        body.theme-contrast-high h5,
        body.theme-contrast-high h6 {
          color: #000000 !important;
        }

        /* Dyslexia-friendly font */
        body.font-dyslexia {
          font-family: 'Arial', 'Helvetica', sans-serif !important;
        }
        
        body.font-dyslexia h1,
        body.font-dyslexia h2,
        body.font-dyslexia h3,
        body.font-dyslexia h4,
        body.font-dyslexia h5,
        body.font-dyslexia h6 {
          font-family: 'Arial', 'Helvetica', sans-serif !important;
        }

        /* Increased line spacing */
        body.line-spacing-increased {
          line-height: 1.8 !important;
        }
        
        body.line-spacing-increased p,
        body.line-spacing-increased li {
          line-height: 2 !important;
        }

        /* Highlight links */
        body.highlight-links a {
          text-decoration: underline !important;
          background-color: rgba(216, 180, 107, 0.2) !important;
          padding: 2px 4px !important;
        }

        /* Reduce motion */
        body.reduce-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `}</style>
    </>
  );
}