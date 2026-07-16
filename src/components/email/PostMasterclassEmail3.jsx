import React from "react";

export default function PostMasterclassEmail3({ userName, certificationUrl }) {
  return (
    <div style={{ fontFamily: 'Georgia, serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#F9F5EF' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1E3A32', padding: '40px 30px', textAlign: 'center' }}>
        <h1 style={{ color: '#F9F5EF', fontSize: '24px', margin: '0 0 10px 0', fontWeight: 'normal' }}>
          Roberta Fernandez
        </h1>
        <p style={{ color: '#D8B46B', fontSize: '14px', letterSpacing: '2px', margin: '0', textTransform: 'uppercase' }}>
          The Mind Stylist
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '50px 30px', backgroundColor: '#FFFFFF' }}>
        <h2 style={{ fontSize: '28px', color: '#1E3A32', marginBottom: '20px', fontFamily: 'Georgia, serif' }}>
          If You're Ready for the Full Journey
        </h2>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          Hi {userName},
        </p>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          Over the past week, I've shared some of the ways I support people in transforming how they think, 
          feel, and show up in the world.
        </p>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          If you're someone who's ready to go deeper — to do the identity-level work that creates lasting change — 
          I want to tell you more about <strong>The Mind Styling Certification™</strong>.
        </p>

        <div style={{ borderLeft: '3px solid #D8B46B', paddingLeft: '20px', marginBottom: '30px' }}>
          <p style={{ fontSize: '18px', color: '#1E3A32', lineHeight: '1.6', fontStyle: 'italic', margin: '0' }}>
            This isn't about surface-level mindset hacks. It's about editing your mental operating system.
          </p>
        </div>

        <h3 style={{ fontSize: '20px', color: '#1E3A32', marginBottom: '15px', marginTop: '30px' }}>
          The certification is a 3-part journey:
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '16px', color: '#1E3A32', fontWeight: 'bold', marginBottom: '5px' }}>
            1. Edit — Identify the patterns
          </p>
          <p style={{ fontSize: '15px', color: '#2B2725', lineHeight: '1.6', marginLeft: '20px' }}>
            Understand the stories, beliefs, and emotional loops running beneath the surface.
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '16px', color: '#1E3A32', fontWeight: 'bold', marginBottom: '5px' }}>
            2. Tailor — Release what no longer fits
          </p>
          <p style={{ fontSize: '15px', color: '#2B2725', lineHeight: '1.6', marginLeft: '20px' }}>
            Let go of outdated conditioning and patterns that keep you stuck.
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '16px', color: '#1E3A32', fontWeight: 'bold', marginBottom: '5px' }}>
            3. Design — Build your next-level identity
          </p>
          <p style={{ fontSize: '15px', color: '#2B2725', lineHeight: '1.6', marginLeft: '20px' }}>
            Construct a mental framework aligned with who you're becoming.
          </p>
        </div>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          It's for leaders, high performers, and anyone navigating a transition who wants to think differently, 
          respond with clarity, and step into the next version of themselves.
        </p>

        <div style={{ backgroundColor: '#6E4F7D', padding: '30px', marginBottom: '30px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#F9F5EF', lineHeight: '1.6', margin: '0' }}>
            This is the work that changes everything — if you're ready for it.
          </p>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <a 
            href={certificationUrl}
            style={{
              display: 'inline-block',
              padding: '16px 40px',
              backgroundColor: '#1E3A32',
              color: '#F9F5EF',
              textDecoration: 'none',
              fontSize: '14px',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}
          >
            Learn About the Certification
          </a>
        </div>

        <p style={{ fontSize: '14px', color: '#2B2725', opacity: 0.7, lineHeight: '1.6', marginTop: '30px' }}>
          And if you have questions, just reply to this email. I'm here.
        </p>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #E4D9C4' }}>
          Thanks for being part of this journey,
          <br />
          <span style={{ fontStyle: 'italic' }}>Roberta</span>
        </p>
      </div>

      {/* Footer */}
      <div style={{ padding: '30px', backgroundColor: '#F9F5EF', textAlign: 'center', borderTop: '1px solid #E4D9C4' }}>
        <p style={{ fontSize: '14px', color: '#2B2725', opacity: 0.7, margin: '0 0 10px 0' }}>
          Questions? Reply to this email — I read every message.
        </p>
        <p style={{ fontSize: '12px', color: '#2B2725', opacity: 0.5, margin: '0' }}>
          © 2025 The Mind Stylist. Las Vegas, NV
        </p>
      </div>
    </div>
  );
}