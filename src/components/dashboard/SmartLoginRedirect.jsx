import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function SmartLoginRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const isAuthenticated = await base44.auth.isAuthenticated();
        
        if (!isAuthenticated) return;
        
        const user = await base44.auth.me();
        
        // Only redirect regular users (not admins or managers)
        const isManager = user.role === 'admin' || user.role === 'manager' || user.custom_role === 'manager';
        
        if (!isManager) {
          // Regular user - redirect to Dashboard
          navigate(createPageUrl('Dashboard'));
        }
        // Admins/managers stay on the current page (marketing site)
        
      } catch (error) {
        // User not authenticated, do nothing
      }
    };

    checkAndRedirect();
  }, [navigate]);

  return null; // This component doesn't render anything
}