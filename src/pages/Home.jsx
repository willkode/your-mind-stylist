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
        title="Your Mind Stylist | Board-Certified Hypnotist, Las Vegas & Henderson NV"
        description="Rewrite Your Mind. Restyle Your Life. Board-Certified Hypnotherapy in Henderson & Las Vegas — clearing emotional clutter so you can step into a life that fits."
        canonical="/"
      />
      {sections.map((section) => {
        const Section = section.component;
        return <Section key={section.key} />;
      })}
    </div>
  );
}