'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  EmergencyKnowledgeService,
  EmergencyAIResponse
} from '@/lib/services/emergency-knowledge.service';
import SOSModal from './sos-modal';
import {
  Bot,
  User,
  Send,
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  MapPin,
  Sparkles,
  HelpCircle,
  Tent,
  Zap,
  Car,
  Home,
  CheckCircle2,
  RefreshCw,
  Locate
} from 'lucide-react';

interface MessageItem {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  responsePayload?: EmergencyAIResponse;
  timestamp: string;
}

interface EmergencyAIAssistantProps {
  locationName?: string;
  latitude?: number;
  longitude?: number;
  riskLevel?: string;
}

export default function EmergencyAIAssistant({
  locationName = 'Active Monitoring Zone',
  latitude = 19.076,
  longitude = 72.8777,
  riskLevel = 'HIGH'
}: EmergencyAIAssistantProps) {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'msg-welcome',
      sender: 'AI',
      text: `Welcome to FloodVision Emergency AI Assistant. I provide instant, safety-first flood protocols and emergency guidance for citizens in affected zones.`,
      responsePayload: {
        answer: `Welcome to FloodVision Emergency AI. What safety assistance do you need right now?`,
        category: 'GENERAL',
        actionableSteps: [
          'Stay calm and prioritize immediate physical safety above property.',
          'Move to upper floors if floodwater enters your building.',
          'Shut off gas and main power breaker ONLY if standing on dry ground.',
          'Click any quick question below or type your emergency situation.'
        ],
        warnings: [
          '🚫 Never walk, swim, or drive through fast-moving floodwater.',
          '⚡ Touch NO electrical switches or outlets if water is present.'
        ],
        emergencyContacts: [
          { label: 'National Emergency', number: '112' },
          { label: 'NDRF Control', number: '1070' },
          { label: 'Ambulance', number: '108' }
        ],
        suggestedFollowUps: [],
        disclaimer: '⚠️ FloodVision Emergency AI provides automated safety guidance. For immediate rescue, call 112 or click the red SOS button.'
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    { label: 'Water entering house', query: 'Water is entering my house. What should I do?' },
    { label: 'Safe to go outside?', query: 'Is it safe to go outside right now?' },
    { label: 'Car stuck in water', query: 'My car is stuck in flood water.' },
    { label: 'Electricity still on', query: 'What should I do if electricity is still on?' },
    { label: 'Nearest safe shelter', query: 'Where is the nearest safe shelter?' },
    { label: 'Evacuate elderly/children', query: 'How to evacuate elderly & children safely?' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    // Simulate AI reasoning & knowledge query
    setTimeout(() => {
      const responsePayload = EmergencyKnowledgeService.queryEmergencyAI(query, locationName);

      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        text: responsePayload.answer,
        responsePayload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  const isHighRisk = ['HIGH', 'CRITICAL', 'DARK_RED'].includes((riskLevel || '').toUpperCase());

  return (
    <div className="w-full rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col h-[750px] relative">
      {/* Header Bar */}
      <div className="p-4 bg-gradient-to-r from-brand-950 via-slate-900 to-background border-b border-border flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
              Flood Emergency AI Assistant
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-brand-500/20 text-brand-300 border border-brand-400/30 uppercase">
                SIH 2026 Ready
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3 text-brand-400" /> Monitored: {locationName}
            </p>
          </div>
        </div>

        {/* Persistent SOS Trigger Button */}
        <button
          onClick={() => setSosModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-red-600/30 animate-pulse transition-all shrink-0"
        >
          <ShieldAlert className="h-4 w-4" /> SOS EMERGENCY
        </button>
      </div>

      {/* High Risk Warning Banner */}
      {isHighRisk && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-600 dark:text-red-400 font-bold flex items-center justify-between shrink-0">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
            ⚠️ High Flood Risk Detected in {locationName}. Ask Emergency AI or trigger SOS if in danger.
          </span>
          <button
            onClick={() => setSosModalOpen(true)}
            className="text-[11px] underline font-extrabold hover:text-red-700 ml-2 shrink-0"
          >
            OPEN SOS NOW
          </button>
        </div>
      )}

      {/* Quick Question Chips */}
      <div className="p-3 bg-muted/30 border-b border-border flex items-center gap-2 overflow-x-auto text-xs shrink-0 no-scrollbar">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5 text-brand-600" /> Quick Ask:
        </span>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q.query)}
            className="px-3 py-1.5 rounded-full bg-card hover:bg-muted border border-border text-foreground font-semibold text-xs transition-colors shrink-0 whitespace-nowrap shadow-sm"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.sender === 'USER' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.sender === 'USER'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {msg.sender === 'USER' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div className={`space-y-2 max-w-xl text-xs`}>
              <div
                className={`p-4 rounded-2xl leading-relaxed shadow-sm ${
                  msg.sender === 'USER'
                    ? 'bg-brand-600 text-white rounded-tr-none font-medium text-xs'
                    : 'bg-card border border-border text-foreground rounded-tl-none space-y-3'
                }`}
              >
                <div>{msg.text}</div>

                {/* Structured Payload Steps for AI Responses */}
                {msg.sender === 'AI' && msg.responsePayload && (
                  <div className="space-y-3 pt-1">
                    {/* Actionable Steps */}
                    {msg.responsePayload.actionableSteps?.length > 0 && (
                      <div className="space-y-1.5 p-3 rounded-xl bg-muted/50 border border-border">
                        <span className="font-extrabold text-xs uppercase text-brand-600 dark:text-brand-400 block">
                          📋 Recommended Safety Steps:
                        </span>
                        <ul className="space-y-1 text-muted-foreground text-[11px]">
                          {msg.responsePayload.actionableSteps.map((stepText, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="font-bold text-foreground shrink-0">{idx + 1}.</span>
                              <span>{stepText}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warnings */}
                    {msg.responsePayload.warnings?.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 space-y-1 text-[11px]">
                        {msg.responsePayload.warnings.map((wText, idx) => (
                          <div key={idx} className="font-bold">
                            {wText}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Direct Contacts */}
                    {msg.responsePayload.emergencyContacts?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.responsePayload.emergencyContacts.map((c, idx) => (
                          <a
                            key={idx}
                            href={`tel:${c.number}`}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] flex items-center gap-1 transition-colors"
                          >
                            <PhoneCall className="h-3 w-3" /> {c.label}: {c.number}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Disclaimer */}
                    <div className="text-[10px] text-muted-foreground italic border-t border-border/40 pt-1.5">
                      {msg.responsePayload.disclaimer}
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-muted-foreground block px-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-card border border-border rounded-xl w-36">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-600" />
            <span>Emergency AI thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-card border-t border-border flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Describe your situation (e.g. Water in room, car trapped, power failure)..."
          className="flex-1 bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isTyping}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </form>

      {/* SOS Modal Component */}
      <SOSModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        initialLat={latitude}
        initialLng={longitude}
        locationName={locationName}
      />
    </div>
  );
}
