import React, { useState } from "react";
import { useCmsText } from "./useCmsText";
import { useEditMode } from "./EditModeProvider";
import { Pencil } from "lucide-react";
import InlineEditor from "./InlineEditor";

export default function CmsText({ 
  contentKey, 
  fallback = "", 
  className = "",
  as = "div",
  page,
  blockTitle,
  contentType = "rich_text",
  maxLength
}) {
  const { content, block } = useCmsText(contentKey, fallback);
  const { isEditMode, isManager } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);

  const Component = as;

  if (!isManager || !isEditMode) {
    // Normal view mode
    if (contentType === "short_text") {
      return <Component className={className}>{content}</Component>;
    }
    return <Component className={className} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  // Edit mode - show editable overlay
  return (
    <>
      <div
        className={`relative ${className} cursor-pointer group hover:outline hover:outline-2 hover:outline-[#D8B46B] hover:outline-offset-2 transition-all`}
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        {contentType === "short_text" ? (
          <Component>{content}</Component>
        ) : (
          <Component dangerouslySetInnerHTML={{ __html: content }} />
        )}
        
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-[#D8B46B] text-white px-2 py-1 text-xs flex items-center gap-1 rounded-bl">
            <Pencil size={12} />
            <span>Edit</span>
          </div>
        </div>
      </div>

      {isEditing && (
        <InlineEditor
          contentKey={contentKey}
          blockTitle={blockTitle || contentKey}
          page={page}
          initialContent={content}
          contentType={contentType}
          maxLength={maxLength}
          block={block}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}