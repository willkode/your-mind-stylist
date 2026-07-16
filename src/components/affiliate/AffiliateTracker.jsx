import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function AffiliateTracker() {
  useEffect(() => {
    const trackAffiliate = async () => {
      // Check URL for affiliate code
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      
      if (refCode) {
        // Store in localStorage for later use during checkout
        localStorage.setItem('affiliate_code', refCode);
        localStorage.setItem('affiliate_code_timestamp', Date.now().toString());
        
        // Track the click
        try {
          await base44.functions.invoke('trackAffiliateClick', {
            affiliate_code: refCode,
            landing_page: window.location.pathname,
            referral_source: urlParams.get('utm_source') || 'direct'
          });
        } catch (error) {
          console.error('Failed to track affiliate click:', error);
        }
      }
    };

    trackAffiliate();
  }, []);

  return null; // This is a utility component with no UI
}