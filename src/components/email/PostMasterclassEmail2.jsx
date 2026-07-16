import React from "react";

export default function PostMasterclassEmail2({ userName, innerRehearsalUrl }) {
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
          Something to Help You Reset
        </h2>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          Hi {userName},
        </p>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          I wanted to introduce you to something you might find useful: <strong>The Inner Rehearsal Sessions™</strong>.
        </p>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '20px' }}>
          These are guided audio sessions designed to help you:
        </p>

        <ul style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.8', marginBottom: '20px', paddingLeft: '30px' }}>
          <li>Regulate your nervous system when you're overwhelmed</li>
          <li>Release patterns of doubt and overthinking</li>
          <li>Rehearse your future self with clarity and confidence</li>
          <li>Reset your mind before important moments</li>
        </ul>

        <p style={{ fontSize: '16px', color: '#2B2725', lineHeight: '1.6', marginBottom: '30px' }}>
          They're not meditation — they're more like mental rehearsal sessions that combine visualization, 
          hypnotic language, and emotional intelligence tools.
        </p>

        <div style={{ backgroundColor: '#F9F5EF', padding: '25px', marginBottom: '30px' }}>
          <p style={{ fontSize: '16px', color: '#1E3A32', lineHeight: '1.6', margin: '0' }}>
            Think of them as a way to <strong>restyle your internal state</strong> when you need it most.
          </p>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <a 
            href={innerRehearsalUrl}
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
            Explore Inner Rehearsal
          </a>
        </div>

        <p style={{ fontSize: '14px', color: '#2B2725', opacity: 0.7, lineHeight: '1.6' }}>
          You can preview sessions and see if they resonate with where you are right now.
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