import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsageForManager } from "@/components/utils/trackUsage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Loader2, Calendar, BookOpen, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIClientAssistant({ variant = "widget" }) {
  const [query, setQuery] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const quickQuestions = [
    { label: "How do I book a session?", icon: Calendar },
    { label: "What courses are available?", icon: BookOpen },
    { label: "How does billing work?", icon: HelpCircle },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = query;
    setQuery("");
    setIsLoading(true);

    // Add user message to conversation
    setConversation(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful AI assistant for "Your Mind Stylist" - a coaching and hypnosis business run by Roberta Fernandez. Answer the following question from a client.

Knowledge Base:
- Services: Private 1:1 coaching, Group coaching, Hypnosis certification training, Mind Styling courses, Pocket Visualization™ daily audio
- Booking: Clients can book through the Bookings page, select a service, choose a time slot, and complete payment
- Courses: Available in the Library after purchase, include video lessons, audio sessions, and resources
- Pricing: Various tiers from $9 courses to premium coaching packages
- Contact: Clients can reach Roberta through the Contact page or email
- Payments: Processed securely through Stripe, subscriptions can be managed in account settings

Client question: ${userMessage}

Provide a friendly, helpful answer (2-3 sentences). If you don't know something specific, direct them to contact Roberta.`,
      });

      setConversation(prev => [...prev, { role: "assistant", content: aiResponse }]);
      trackUsageForManager({ feature: "ai_client_assistant", integration_type: "InvokeLLM", details: `Client Q: ${userMessage.substring(0, 60)}` });
    } catch (error) {
      console.error("AI assistant error:", error);
      setConversation(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: "I'm having trouble right now. Please reach out to Roberta directly through the Contact page." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = async (question) => {
    setQuery(question);
    if (variant === "widget") {
      setIsOpen(true);
    }
    
    // Auto-submit the question
    setConversation(prev => [...prev, { role: "user", content: question }]);
    setIsLoading(true);
    
    try {
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful AI assistant for "Your Mind Stylist" - a coaching and hypnosis business run by Roberta Fernandez. Answer the following question from a client.

Knowledge Base:
- Services: Private 1:1 coaching, Group coaching, Hypnosis certification training, Mind Styling courses, Pocket Visualization™ daily audio
- Booking: Clients can book through the Bookings page, select a service, choose a time slot, and complete payment
- Courses: Available in the Library after purchase, include video lessons, audio sessions, and resources
- Pricing: Various tiers from $9 courses to premium coaching packages
- Contact: Clients can reach Roberta through the Contact page or email
- Payments: Processed securely through Stripe, subscriptions can be managed in account settings

Client question: ${question}

Provide a friendly, helpful answer (2-3 sentences). If you don't know something specific, direct them to contact Roberta.`,
      });

      setConversation(prev => [...prev, { role: "assistant", content: aiResponse }]);
      trackUsageForManager({ feature: "ai_client_assistant", integration_type: "InvokeLLM", details: `Client Quick Q: ${question.substring(0, 60)}` });
    } catch (error) {
      console.error("AI assistant error:", error);
      setConversation(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: "I'm having trouble right now. Please reach out to Roberta directly through the Contact page." 
        }
      ]);
    } finally {
      setIsLoading(false);
      setQuery("");
    }
  };

  // Widget version (floating chat)
  if (variant === "widget") {
    return (
      <>
        {/* Chat Button - Hidden on Mobile */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden lg:flex fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#1E3A32] text-white shadow-lg hover:bg-[#2B2725] transition-all z-40 items-center justify-center"
          title="Ask a question"
        >
          {isOpen ? "✕" : <MessageCircle size={24} />}
        </button>

        {/* Chat Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed inset-x-4 bottom-4 lg:bottom-24 lg:right-6 lg:left-auto lg:w-96 max-h-[60vh] lg:max-h-96 bg-white rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="bg-[#1E3A32] text-white p-3 lg:p-4">
                <h3 className="font-medium flex items-center gap-2 text-sm lg:text-base">
                  <MessageCircle size={16} />
                  Ask Me Anything
                </h3>
                <p className="text-[10px] lg:text-xs text-white/80 mt-1">
                  Get instant answers about services, booking, and more
                </p>
              </div>

              {/* Conversation */}
              <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 bg-[#F9F5EF]">
                {conversation.length === 0 && (
                  <div>
                    <p className="text-sm text-[#2B2725]/70 mb-3">
                      Hi! How can I help you today?
                    </p>
                    <div className="space-y-2">
                      {quickQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickQuestion(q.label)}
                          className="flex items-center gap-2 w-full p-2 bg-white hover:bg-[#D8B46B]/10 rounded text-left text-xs lg:text-sm"
                        >
                          <q.icon size={12} className="text-[#D8B46B] flex-shrink-0" />
                          <span className="line-clamp-2">{q.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2 lg:p-3 rounded-lg text-xs lg:text-sm ${
                      msg.role === "user"
                        ? "bg-[#D8B46B] text-white ml-4 lg:ml-8"
                        : "bg-white mr-4 lg:mr-8"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    Thinking...
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-3 lg:p-4 border-t border-[#E4D9C4] bg-white">
                <div className="flex gap-2 text-sm">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type your question..."
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!query.trim() || isLoading}
                    className="bg-[#1E3A32] hover:bg-[#2B2725]"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Full page version
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle size={20} className="text-[#D8B46B]" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Questions */}
        {conversation.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-[#2B2725]/70">Quick questions:</p>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(q.label)}
                className="flex items-center gap-2 w-full p-3 bg-[#F9F5EF] hover:bg-[#E4D9C4] rounded text-left"
              >
                <q.icon size={16} className="text-[#D8B46B]" />
                <span className="text-sm">{q.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Conversation */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg ${
                msg.role === "user"
                  ? "bg-[#D8B46B]/10 ml-8"
                  : "bg-[#F9F5EF] mr-8"
              }`}
            >
              <Badge className="mb-2 text-xs">
                {msg.role === "user" ? "You" : "Assistant"}
              </Badge>
              <p className="text-sm text-[#2B2725]">{msg.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 p-4 bg-[#F9F5EF] rounded-lg">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="bg-[#1E3A32] hover:bg-[#2B2725]"
          >
            <Send size={16} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}