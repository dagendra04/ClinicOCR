import { getDashboardStats } from '@/actions/prescriptions';
import { getPatients } from '@/actions/patients';
import StatCard from '@/components/cards/StatCard';
import RecentPrescriptionCard from '@/components/cards/RecentPrescriptionCard';
import Link from 'next/link';
import {
  Users,
  FileText,
  Upload,
  UserPlus,
  TrendingUp,
  Clock,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'ClinicOCR dashboard — overview of clinic records and recent prescriptions.',
};

export default async function DashboardPage() {
  const [stats] = await Promise.all([
    getDashboardStats(),
  ]);

  const recent = stats.recentPrescriptions;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">
            Welcome back — here&apos;s your clinic overview.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/patients/new" className="btn-secondary">
            <UserPlus className="w-4 h-4" />
            Add Patient
          </Link>
          <Link href="/upload" className="btn-primary">
            <Upload className="w-4 h-4" />
            Upload Prescription
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<Users className="w-5 h-5" />}
          colorClass="bg-brand-50 text-brand-600"
          trend="Registered in the system"
        />
        <StatCard
          title="Total Prescriptions"
          value={stats.totalPrescriptions}
          icon={<FileText className="w-5 h-5" />}
          colorClass="bg-emerald-50 text-emerald-600"
          trend="Digitized records"
        />
        <StatCard
          title="Recent Uploads"
          value={recent.length}
          icon={<TrendingUp className="w-5 h-5" />}
          colorClass="bg-violet-50 text-violet-600"
          trend="In the last session"
        />
      </div>

      {/* Recent Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              Recent Prescriptions
            </h2>
            <Link href="/prescriptions" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              View all →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">No prescriptions yet.</p>
              <Link href="/upload" className="btn-primary mt-4 mx-auto w-fit">
                <Upload className="w-4 h-4" />
                Upload First Prescription
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(({ prescription, patient }) => (
                <RecentPrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                  patient={patient}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/upload"
              className="card card-hover flex items-center gap-3 p-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                <Upload className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">Upload Prescription</p>
                <p className="text-xs text-text-muted">Digitize a new record</p>
              </div>
            </Link>

            <Link
              href="/patients/new"
              className="card card-hover flex items-center gap-3 p-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <UserPlus className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">Add New Patient</p>
                <p className="text-xs text-text-muted">Register patient details</p>
              </div>
            </Link>

            <Link
              href="/patients"
              className="card card-hover flex items-center gap-3 p-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">View All Patients</p>
                <p className="text-xs text-text-muted">Browse patient records</p>
              </div>
            </Link>

            <Link
              href="/search"
              className="card card-hover flex items-center gap-3 p-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">Search Records</p>
                <p className="text-xs text-text-muted">Find by patient, medicine</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
