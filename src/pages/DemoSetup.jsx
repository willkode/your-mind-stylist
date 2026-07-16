import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Sparkles, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import SEO from "../components/SEO";

export default function DemoSetup() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    setError(null);
    
    try {
      const response = await base44.functions.invoke('seedDemoData', {
        demo_email: 'demo@yourmindstylist.com'
      });
      
      if (response.data.success) {
        setIsComplete(true);
      } else {
        setError(response.data.error || 'Failed to seed demo data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <>
      <SEO
        title="Demo Setup - Your Mind Stylist"
        description="Set up transformation demo data"
      />
      <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            {!isComplete ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles size={32} className="text-[#D8B46B]" />
                  <h1 className="font-serif text-3xl text-[#1E3A32]">
                    Demo Setup
                  </h1>
                </div>

                <p className="text-[#2B2725]/70 mb-6 leading-relaxed">
                  This will create a realistic 90-day transformation journey with:
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    'Multiple reflections showing breakthrough moments',
                    'Milestone achievements (streaks, learning, breakthroughs)',
                    'Transformation snapshots tracking emotional progress',
                    'Daily check-ins showing improvement over time',
                    'A complete journey from anxious beginner to grounded practitioner'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-[#A6B7A3] flex-shrink-0 mt-0.5" />
                      <span className="text-[#2B2725]/80">{item}</span>
                    </li>
                  ))}
                </ul>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleSeedDemo}
                  disabled={isSeeding}
                  className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-white py-6 text-lg"
                  size="lg"
                >
                  {isSeeding ? (
                    <>
                      <Loader2 size={20} className="mr-2 animate-spin" />
                      Creating Demo Data...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} className="mr-2" />
                      Generate Demo Journey
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <h2 className="font-serif text-3xl text-[#1E3A32] mb-3">
                    Demo Data Created!
                  </h2>
                  <p className="text-[#2B2725]/70">
                    Your demo transformation journey is ready to showcase.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link to={createPageUrl("TransformationDemo")}>
                    <Button className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-white py-6" size="lg">
                      <ExternalLink size={18} className="mr-2" />
                      View Demo Experience
                    </Button>
                  </Link>
                  <Link to={createPageUrl("ManagerDashboard")}>
                    <Button variant="outline" className="w-full py-6" size="lg">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>

                <div className="mt-8 p-4 bg-[#F9F5EF] rounded-lg">
                  <p className="text-sm text-[#2B2725]/70 mb-2">
                    <strong>Shareable Demo Link:</strong>
                  </p>
                  <code className="text-xs bg-white p-2 rounded block text-[#2B2725]">
                    {window.location.origin}{createPageUrl("TransformationDemo")}
                  </code>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}