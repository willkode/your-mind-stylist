import React from "react";
import { Helmet } from "react-helmet";

export default function SEO({ 
  title, 
  description, 
  ogImage = "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=1200&h=630&fit=crop",
  canonical,
  article = false,
  author = "Roberta Fernandez",
  publishedTime,
  modifiedTime,
  tags = [],
  category,
}) {
  const fullTitle = title.includes("Your Mind Stylist") 
    ? title 
    : `${title} | Your Mind Stylist`;
  
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : (typeof window !== 'undefined' ? window.location.href : '');
  
  // Generate structured data
  const generateStructuredData = () => {
    if (article) {
      return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": description,
        "image": ogImage,
        "datePublished": publishedTime,
        "dateModified": modifiedTime || publishedTime,
        "author": {
          "@type": "Person",
          "name": author,
          "url": `${siteUrl}/about`
        },
        "publisher": {
          "@type": "Organization",
          "name": "Your Mind Stylist",
          "logo": {
            "@type": "ImageObject",
            "url": `${siteUrl}/logo.png`
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl
        },
        ...(category && { "articleSection": category }),
        ...(tags.length > 0 && { "keywords": tags.join(", ") })
      };
    } else {
      return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Your Mind Stylist",
        "description": description,
        "url": siteUrl,
        "publisher": {
          "@type": "Organization",
          "name": "Your Mind Stylist"
        }
      };
    }
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:type" content={article ? "article" : "website"} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Your Mind Stylist" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@YourMindStylist" />
      
      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Article specific */}
      {article && (
        <>
          <meta property="article:author" content={author} />
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {category && <meta property="article:section" content={category} />}
          {tags.map((tag, idx) => (
            <meta key={idx} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(generateStructuredData())}
      </script>
      
      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
    </Helmet>
  );
}