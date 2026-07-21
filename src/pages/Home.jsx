import React from "react";
import SEO from "../components/SEO";
import SmartLoginRedirect from "../components/dashboard/SmartLoginRedirect";
import { usePageLayout } from "../components/cms/usePageLayout";

export default function Home() {
  const sections = usePageLayout("Home");

  return (
    <div className="bg-[#F9F5EF]">
      <SmartLoginRedirect />
      <SEO
        title="Your Mind Stylist | Emotional Intelligence & Mindset Transformation"
        description="Emotional intelligence, mind styling, and inner transformation with Your Mind Stylist, Roberta Fernandez. Rewrite your patterns and restyle your life from the inside out."
        canonical="/"
      />
      {sections.map((section) => {
        const Section = section.component;
        return <Section key={section.key} />;
      })}
    </div>
  );
}