import React from "react";
import { User } from "lucide-react";

export default function AuthorCard({ author }) {
  if (!author) return null;

  return (
    <div className="flex items-start gap-4 p-6 bg-[#F9F5EF] rounded-lg border border-[#E4D9C4]">
      {author.profile_image ? (
        <img
          src={author.profile_image}
          alt={author.display_name}
          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-[#1E3A32] flex items-center justify-center">
          <User size={24} className="text-white" />
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-serif text-xl text-[#1E3A32] mb-1">
          {author.display_name}
          {author.is_guest && (
            <span className="ml-2 text-sm text-[#2B2725]/60 font-sans">(Guest Author)</span>
          )}
        </h3>
        {author.bio && (
          <p className="text-[#2B2725]/80 text-sm leading-relaxed mb-3">{author.bio}</p>
        )}
        {(author.website || author.social_links) && (
          <div className="flex flex-wrap gap-3 text-sm">
            {author.website && (
              <a
                href={author.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors"
              >
                Website
              </a>
            )}
            {author.social_links?.twitter && (
              <a
                href={`https://twitter.com/${author.social_links.twitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors"
              >
                Twitter
              </a>
            )}
            {author.social_links?.linkedin && (
              <a
                href={`https://${author.social_links.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors"
              >
                LinkedIn
              </a>
            )}
            {author.social_links?.instagram && (
              <a
                href={`https://instagram.com/${author.social_links.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors"
              >
                Instagram
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}