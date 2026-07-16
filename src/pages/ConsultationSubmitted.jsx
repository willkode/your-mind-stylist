import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Calendar, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function ConsultationSubmitted() {
  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 size={48} className="text-green-600" />
            </div>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-4">
            Your Intake Form Has Been Received
          </h1>

          <p className="text-lg text-[#2B2725]/80 mb-8">
            Thank you for completing your consultation questionnaire. No further action is required from you at this time.
          </p>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">What Happens Next?</h2>
              <div className="text-left space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="text-[#D8B46B] mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-[#1E3A32]">You'll receive a confirmation email</p>
                    <p className="text-sm text-[#2B2725]/70">
                      We've sent a copy of your submission to your email address for your records.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="text-[#D8B46B] mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-[#1E3A32]">Your consultation is confirmed</p>
                    <p className="text-sm text-[#2B2725]/70">
                      Your intake form has been submitted at least 24 hours in advance, as required.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="text-[#D8B46B] mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-[#1E3A32]">Prepare for your session</p>
                    <p className="text-sm text-[#2B2725]/70">
                      Review your concerns and questions. We'll discuss everything during your consultation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
            <h3 className="font-medium text-[#1E3A32] mb-2">Need to Make Changes?</h3>
            <p className="text-sm text-[#2B2725]/80 mb-4">
              If you need to reschedule or have questions before your consultation, please contact us:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:612-839-2295" className="text-[#D8B46B] hover:text-[#1E3A32] font-medium">
                612-839-2295
              </a>
              <span className="hidden sm:inline text-[#2B2725]/40">|</span>
              <a href="mailto:roberta@yourmindstylist.com" className="text-[#D8B46B] hover:text-[#1E3A32] font-medium">
                roberta@yourmindstylist.com
              </a>
            </div>
          </div>

          <Link to={createPageUrl("Home")}>
            <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]">
              Return to Homepage
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}