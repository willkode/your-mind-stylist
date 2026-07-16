import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, TrendingUp, Calendar, DollarSign, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIManagerAssistant() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const quickPrompts = [
    { 
      label: "Revenue Analysis", 
      prompt: "Analyze my revenue trends over the last 30 days and give me actionable insights.",
      icon: DollarSign 
    },
    { 
      label: "Booking Patterns", 
      prompt: "What are the most popular booking times and services?",
      icon: Calendar 
    },
    { 
      label: "Client Retention", 
      prompt: "Which clients are at risk of churning based on their recent activity?",
      icon: Users 
    },
    { 
      label: "Growth Opportunities", 
      prompt: "Suggest growth opportunities based on my current offerings and client behavior.",
      icon: TrendingUp 
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = query;
    setQuery("");

    try {
      // Fetch context data
      const [bookings, users, products, courses] = await Promise.all([
        base44.entities.Booking.list("-created_date", 50),
        base44.entities.User.list("-created_date", 50),
        base44.entities.Product.list(),
        base44.entities.Course.list(),
      ]);

      // Build context
      const contextData = {
        total_bookings: bookings.length,
        paid_bookings: bookings.filter(b => b.payment_status === "paid").length,
        total_revenue: bookings
          .filter(b => b.payment_status === "paid")
          .reduce((sum, b) => sum + (b.amount || 0), 0),
        active_users: users.length,
        products_count: products.length,
        courses_count: courses.length,
        recent_bookings: bookings.slice(0, 10).map(b => ({
          service: b.service_type,
          amount: b.amount,
          status: b.booking_status,
          date: b.scheduled_date || b.created_date,
        })),
      };

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI business assistant for a Mind Styling coaching business. Analyze the following business data and answer the manager's question.

Context:
- Total bookings: ${contextData.total_bookings}
- Paid bookings: ${contextData.paid_bookings}
- Total revenue: $${(contextData.total_revenue / 100).toFixed(2)}
- Active users: ${contextData.active_users}
- Products: ${contextData.products_count}
- Courses: ${contextData.courses_count}

Recent bookings:
${contextData.recent_bookings.map(b => `- ${b.service}: $${(b.amount / 100).toFixed(2)} (${b.status})`).join('\n')}

Manager's question: ${userMessage}

Provide a concise, actionable response with specific insights and recommendations.`,
      });

      const newConversation = [
        ...conversationHistory,
        { role: "user", content: userMessage },
        { role: "assistant", content: aiResponse },
      ];
      
      setConversationHistory(newConversation);
      setResponse(aiResponse);
      trackUsage({ feature: "ai_manager_assistant", integration_type: "InvokeLLM", details: userMessage.substring(0, 60) });
    } catch (error) {
      console.error("AI query error:", error);
      setResponse("Sorry, I couldn't process your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setQuery(prompt);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-[#D8B46B]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#D8B46B]" />
            AI Manager Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Prompts */}
          <div>
            <p className="text-sm text-[#2B2725]/60 mb-3">Quick Insights</p>
            <div className="grid md:grid-cols-2 gap-3">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(prompt.prompt)}
                  className="flex items-center gap-3 p-3 bg-[#F9F5EF] hover:bg-[#E4D9C4] rounded transition-colors text-left"
                >
                  <prompt.icon size={18} className="text-[#D8B46B] flex-shrink-0" />
                  <span className="text-sm text-[#1E3A32]">{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation History */}
          <AnimatePresence>
            {conversationHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 max-h-96 overflow-y-auto"
              >
                {conversationHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      msg.role === "user"
                        ? "bg-[#D8B46B]/10 ml-8"
                        : "bg-[#F9F5EF] mr-8"
                    }`}
                  >
                    <Badge className="mb-2 text-xs">
                      {msg.role === "user" ? "You" : "AI Assistant"}
                    </Badge>
                    <p className="text-sm text-[#2B2725] whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Query Input */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything about your business... (e.g., 'What's my top-performing service?' or 'Which clients should I follow up with?')"
              rows={3}
              disabled={isLoading}
            />
            <CreditGateBanner feature="ai_manager_assistant">
              <Button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Ask AI Assistant
                  </>
                )}
              </Button>
            </CreditGateBanner>
          </form>

          <p className="text-xs text-[#2B2725]/40 text-center">
            AI responses are based on your booking, user, and product data
          </p>
        </CardContent>
      </Card>
    </div>
  );
}