import React from "react";

export default function PocketMindsetPurchaseConfirmation({ customerName, accessCode }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px', backgroundColor: '#F9F5EF' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '30px 20px', backgroundColor: '#1E3A32' }}>
        <h1 style={{ color: '#F9F5EF', fontFamily: 'Georgia, serif', fontSize: '28px', margin: '0 0 10px 0' }}>
          Welcome to Pocket Mindset™
        </h1>
        <p style={{ color: '#D8B46B', fontSize: '14px', margin: '0', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Your Mind Styling Journey Begins
        </p>
      </div>

      {/* Main Content */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '40px 30px' }}>
        <p style={{ color: '#2B2725', fontSize: '16px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          Hi {customerName || 'there'},
        </p>

        <p style={{ color: '#2B2725', fontSize: '16px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          Thank you for your purchase! Here is the information you need to set up your Pocket Mindset account.
        </p>

        {/* App Download Section */}
        <div style={{ backgroundColor: '#F9F5EF', padding: '20px', marginBottom: '30px', borderRadius: '4px' }}>
          <h2 style={{ color: '#1E3A32', fontSize: '20px', margin: '0 0 15px 0', fontFamily: 'Georgia, serif' }}>
            Step 1: Download the App
          </h2>
          <p style={{ color: '#2B2725', fontSize: '15px', lineHeight: '1.6', margin: '0 0 15px 0' }}>
            Download Pocket Mindset from the Apple App Store or the Google Play Store.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
            <a href="https://apps.apple.com/app/pocket-mindset" style={{ display: 'inline-block' }}>
              <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on App Store" style={{ height: '40px' }} />
            </a>
            <a href="https://play.google.com/store/apps" style={{ display: 'inline-block' }}>
              <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style={{ height: '58px', marginTop: '-9px' }} />
            </a>
          </div>
        </div>

        {/* Setup Instructions */}
        <div style={{ backgroundColor: '#E4D9C4', padding: '20px', marginBottom: '30px', borderRadius: '4px' }}>
          <h2 style={{ color: '#1E3A32', fontSize: '20px', margin: '0 0 15px 0', fontFamily: 'Georgia, serif' }}>
            Step 2: Set Up Your Account
          </h2>
          <ol style={{ color: '#2B2725', fontSize: '15px', lineHeight: '1.8', margin: '0', paddingLeft: '20px' }}>
            <li>Select <strong>new account</strong></li>
            <li>Under the <strong>Browse tab</strong>, enroll in the Courses and Programs of your choice</li>
            <li>Enter this code when prompted: <span style={{ backgroundColor: '#1E3A32', color: '#D8B46B', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '18px', display: 'inline-block', margin: '5px 0' }}>{accessCode || '[access_code]'}</span></li>
          </ol>
        </div>

        {/* Access Instructions */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#1E3A32', fontSize: '20px', margin: '0 0 15px 0', fontFamily: 'Georgia, serif' }}>
            Step 3: Access Your Content
          </h2>
          <p style={{ color: '#2B2725', fontSize: '15px', lineHeight: '1.6', margin: '0 0 15px 0' }}>
            Once you enroll in a Course or Wellbeing Program, you will access it in the <strong>My Programs tab</strong>, where all modules remain available for listening.
          </p>
        </div>

        {/* Content Types */}
        <div style={{ backgroundColor: '#F9F5EF', padding: '20px', marginBottom: '30px', borderRadius: '4px' }}>
          <h2 style={{ color: '#1E3A32', fontSize: '20px', margin: '0 0 20px 0', fontFamily: 'Georgia, serif' }}>
            What's Included
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#6E4F7D', fontSize: '16px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
              5 Core Courses
            </h3>
            <p style={{ color: '#2B2725', fontSize: '14px', lineHeight: '1.6', margin: '0' }}>
              For stress, pain, sleep, weight, and smoking cessation. The Course modules are delivered one at a time over 7 to 55 days.
            </p>
          </div>

          <div>
            <h3 style={{ color: '#6E4F7D', fontSize: '16px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
              3 Wellbeing Programs
            </h3>
            <p style={{ color: '#2B2725', fontSize: '14px', lineHeight: '1.6', margin: '0' }}>
              Physical, financial, and emotional/mental - which can be used in conjunction with the Courses, or at any time, in any order. These recordings are listed alphabetically and cover a very wide range of issues.
            </p>
          </div>
        </div>

        {/* Support */}
        <div style={{ borderTop: '2px solid #D8B46B', paddingTop: '20px' }}>
          <p style={{ color: '#2B2725', fontSize: '15px', lineHeight: '1.6', margin: '0 0 10px 0' }}>
            Questions or need help? We're here for you.
          </p>
          <p style={{ color: '#2B2725', fontSize: '15px', lineHeight: '1.6', margin: '0' }}>
            Email: <a href="mailto:roberta@yourmindstylist.com" style={{ color: '#1E3A32', textDecoration: 'none' }}>roberta@yourmindstylist.com</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', color: '#2B2725', fontSize: '12px' }}>
        <p style={{ margin: '0 0 10px 0' }}>© {new Date().getFullYear()} Your Mind Stylist. All rights reserved.</p>
        <p style={{ margin: '0' }}>
          <a href="https://yourmindstylist.com" style={{ color: '#1E3A32', textDecoration: 'none' }}>yourmindstylist.com</a>
        </p>
      </div>
    </div>
  );
}