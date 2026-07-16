import React from "react";

export default function PostMasterclassEmail1({ userName, dashboardUrl }) {
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
          A Question for Reflection
        </h2>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          Hi {userName},
        </p>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          Thank you for watching the masterclass on imposter syndrome. I hope something in it resonated.
        </p>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '30px' }}>
          Here's a question to sit with this week:
        </p>

        <div style={{ backgroundColor: '#F9F5EF', padding: '30px', marginBottom: '30px' }}>
          <p style={{ fontSize: '18px', color: '#1E3A32', lineHeight: '1.6', fontStyle: 'italic', margin: '0' }}>
            "What would change if you stopped questioning whether you belong, and simply trusted that you do?"
          </p>
        </div>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          You don't need to answer it right away. Just notice what comes up.
        </p>

        <div style={{ borderTop: '2px solid #D8B46B', paddingTop: '30px', marginTop: '40px' }}>
          <h3 style={{ fontSize: '20px', color: '#1E3A32', marginBottom: '15px' }}>
            Want to Go Deeper?
          </h3>
          <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
            If what you learned in the masterclass resonated, you might be interested in 
            <strong> The Mind Styling Certification™</strong> — a complete program to help you edit your patterns, 
            release what's holding you back, and design the identity you want to step into.
          </p>
          <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
            It's for people ready to do the deeper work — not quick fixes, but lasting transformation.
          </p>

          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a 
              href={`${dashboardUrl}?view=certification`}
              style={{
                display: 'inline-block',
                padding: '14px 35px',
                backgroundColor: '#1E3A32',
                color: '#F9F5EF',
                textDecoration: 'none',
                fontSize: '14px',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              Explore the Certification
            </a>
          </div>
        </div>
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