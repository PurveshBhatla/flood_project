'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  Waves,
  MapPin,
  ShieldAlert,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Bell,
  Info,
  PhoneCall,
  ListFilter,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch('/api/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (data.notifications) {
            const unread = data.notifications.filter((n: any) => !n.read).length;
            setUnreadCount(unread);
          }
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  const navLinks = [
    { href: '/', label: 'Home', icon: Waves },
    { href: '/map', label: 'Live Map', icon: MapPin },
    { href: '/incidents', label: 'Incidents', icon: ListFilter },
    { href: '/report', label: 'Report Waterlogging', icon: PlusCircle },
    { href: '/admin', label: 'Admin Portal', icon: ShieldAlert },
    { href: '/about', label: 'About', icon: Info },
    { href: '/contact', label: 'Contact', icon: PhoneCall },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 to-cyan-500 text-white shadow-md shadow-brand-600/30 group-hover:scale-105 transition-transform">
            <Waves className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-foreground flex items-center gap-1">
              Flood<span className="text-brand-600">Watch</span>
            </span>
            <span className="block text-[9.5px] text-muted-foreground font-semibold uppercase tracking-wider">
              Community Waterlogging Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Quick Report CTA + User Auth Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/report"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-sm shadow-amber-500/20 hover:scale-105"
          >
            <PlusCircle className="h-4 w-4" />
            Report Incident
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/notifications"
                className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-sm"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </Link>

              <button
                onClick={() => logout()}
                className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs font-bold text-foreground hover:text-brand-600 hover:bg-muted/60 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-background px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <link.icon className="h-4 w-4 text-brand-600" />
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <Link
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Report Waterlogging Incident
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs font-bold bg-brand-600 text-white rounded-xl"
                >
                  Admin Portal
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-center text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs font-bold border border-border rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs font-bold bg-brand-600 text-white rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
