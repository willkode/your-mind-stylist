import React from "react";

export default function MasterclassReminder({ userName, masterclassUrl }) {
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
          Ready to Finish Your Masterclass?
        </h2>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          Hi {userName},
        </p>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          I noticed you started your free masterclass on imposter syndrome, but haven't finished it yet.
        </p>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          No pressure — life gets busy. But if you're curious about what's beneath those "I'm not enough" 
          feelings, the full session is waiting for you.
        </p>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '30px' }}>
          It's about 45 minutes. You can watch in one sitting, or pause and come back to it.
        </p>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <a 
            href={masterclassUrl}
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
            Continue Watching
          </a>
        </div>

        <p style={{ fontSize: '14px', color: '#2B2725', opacity: 0.7, lineHeight: '1.6', marginTop: '30px' }}>
          If it's not for you right now, that's completely okay. You can always come back to it later.
        </p>
      </div>

      {/* Footer */}
      <div style={{ padding: '30px', backgroundColor: '#F9F5EF', textAlign: 'center', borderTop: '1px solid #E4D9C4' }}>
        <p style={{ fontSize: '14px', color: '#2B2725', opacity: 0.7, margin: '0 0 10px 0' }}>
          Questions? Reply to this email or visit our contact page.
        </p>
        <p style={{ fontSize: '12px', color: '#2B2725', opacity: 0.5, margin: '0' }}>
          © 2025 The Mind Stylist. Las Vegas, NV
        </p>
      </div>
    </div>
  );
}