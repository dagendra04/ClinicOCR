'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Search,
  Upload,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/patients',  label: 'Patients',      icon: Users },
  { href: '/search',    label: 'Search',         icon: Search },
  { href: '/prescriptions', label: 'Prescriptions', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-surface-border flex flex-col z-30">
      {/* Logo */}
      <div className="p-6 border-b border-surface-border">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-md group-hover:bg-brand-700 transition-colors">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-text-primary text-base leading-tight">ClinicOCR</p>
            <p className="text-[11px] text-text-muted leading-tight">AI Prescription Platform</p>
          </div>
        </Link>
      </div>

      {/* Quick Upload */}
      <div className="p-4">
        <Link
          href="/upload"
          className="btn-primary w-full justify-center py-2.5"
        >
          <Upload className="w-4 h-4" />
          Upload Prescription
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4',
                  isActive ? 'text-brand-600' : 'text-text-muted'
                )}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-border">
        <div className="rounded-xl bg-brand-50 p-3">
          <p className="text-xs font-semibold text-brand-700 mb-0.5">ClinicOCR v1.0</p>
          <p className="text-[11px] text-brand-500 leading-relaxed">
            Powered by Tesseract OCR &amp; Google Gemini
          </p>
        </div>
      </div>
    </aside>
  );
}
