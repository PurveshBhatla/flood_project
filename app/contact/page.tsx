'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setError(data.error || 'Failed to submit contact message');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 space-y-12">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center space-y-4">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Get In Touch</span>
        <h1 className="text-4xl font-extrabold tracking-tight">Contact Disaster Intelligence Team</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Inquire about sensor API integration, community onboarding, or emergency telemetry access.
        </p>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Contact Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our disaster technical team operates 24/7 during active flood watch alerts. Submit your message to connect with our emergency response hydrologists.
          </p>

          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <Mail className="h-5 w-5 text-brand-600 shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">Email Support</span>
                <strong className="text-foreground">support@floodvision.org</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <Phone className="h-5 w-5 text-brand-600 shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">Telecomm Ops Command</span>
                <strong className="text-foreground">+1 (800) 555-FLOOD</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <MapPin className="h-5 w-5 text-brand-600 shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">HQ Operations Center</span>
                <strong className="text-foreground">Disaster Tech Complex, Environment Sq.</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-card border border-border shadow-xl space-y-6">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Message Received</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Thank you for contacting FloodVision. Our disaster response team will process your request shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="API Integration / Sensor Telemetry"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Transmitting...' : <><Send className="h-4 w-4" /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
