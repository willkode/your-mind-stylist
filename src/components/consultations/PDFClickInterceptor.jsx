import React, { useState } from "react";
import DocumentModal from "./DocumentModal";

/**
 * Wraps content and intercepts clicks on PDF links, opening them in a modal instead of downloading
 * This ensures users preview content before deciding to download
 */
export default function PDFClickInterceptor({ children, title, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleClick = (e) => {
    // Check if the clicked element is a link
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.href;
    
    // Only intercept PDF links and those with href
    if (href && href.toLowerCase().endsWith('.pdf')) {
      e.preventDefault();
      setPdfUrl(href);
      setIsOpen(true);
    }
  };

  return (
    <>
      <div onClick={handleClick}>
        {children}
      </div>
      {pdfUrl && (
        <DocumentModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={title || label || "Document"}
          url={pdfUrl}
        />
      )}
    </>
  );
}