import Link from "next/link";

export const metadata = { title: "Terms of Use — Orbit" };

export default function TermsPage() {
  const sections = [
    { t: "Acceptance of Terms", d: "By accessing and using Orbit, you accept and agree to be bound by these Terms of Use. If you do not agree, please discontinue use immediately. These terms apply to all users of the application." },
    { t: "Description of Service", d: "Orbit is a cloud-based lead management and CRM platform operated by Sita Enterprises Pvt. Ltd. It helps sales teams track, organize, manage, and follow up on potential customers efficiently." },
    { t: "User Account & Authentication", d: "You must sign in using Google Authentication to access Orbit. You are responsible for all activities under your account. Do not share your credentials or allow unauthorized access to your account." },
    { t: "User Responsibilities", d: "You agree to provide accurate information, use the service lawfully, not attempt to access other users' data, not reverse-engineer or misuse the platform, and comply with all applicable Indian and international laws." },
    { t: "Data Ownership & Usage", d: "All lead data, follow-up logs, and notes you enter remain your exclusive property. Sita Enterprises Pvt. Ltd. does not claim ownership of your data. You may export your data at any time via the in-app export feature." },
    { t: "Intellectual Property", d: "The Orbit application, its design, code, logos, and branding are the intellectual property of Sita Enterprises Pvt. Ltd. You may not copy, modify, distribute, or create derivative works without written permission." },
    { t: "Limitation of Liability", d: "Orbit is provided \"as is\" without warranty of any kind. Sita Enterprises Pvt. Ltd. shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use the service." },
    { t: "Service Availability", d: "We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance, updates, or unforeseen technical issues may temporarily affect availability." },
    { t: "Termination", d: "We reserve the right to suspend or terminate your access at any time for violation of these terms. You may also delete your account at any time. Upon termination, your data will be retained for 30 days before permanent deletion." },
    { t: "Governing Law", d: "These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India." },
    { t: "Changes to Terms", d: "We may update these terms periodically. Continued use of Orbit after changes constitutes acceptance of the revised terms. Material changes will be communicated via the application." },
    { t: "Contact", d: "For questions about these Terms of Use, contact us at sitaenterprisespvtltd@gmail.com" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F0]">
      <div className="max-w-lg mx-auto pb-10">
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm px-5 py-3.5 flex items-center gap-3" style={{ boxShadow: "0 1px 0 #ECEEE8" }}>
          <Link href="/" className="p-1.5 -ml-1.5 rounded-xl text-[#9CA3AF] active:scale-90 transition-transform">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <span className="text-[16px] font-bold text-[#1A1A1A]">Terms of Use</span>
        </div>
        <div className="px-4 pt-5">
          <div className="bg-white rounded-3xl p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div className="w-12 h-12 rounded-2xl bg-[#3B5BDB]/10 flex items-center justify-center text-[#3B5BDB] mb-4">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
            </div>
            <h1 className="text-[24px] font-extrabold text-[#1A1A1A] tracking-tight mb-2">Terms of Use</h1>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">Please read these terms carefully before using Orbit. By using our services, you agree to comply with and be bound by these terms and conditions.</p>
            <div className="mt-4 pt-3 border-t border-[#F3F4F0] flex items-center justify-between">
              <p className="text-[12px] text-[#9CA3AF]">Sita Enterprises Pvt. Ltd.</p>
              <p className="text-[12px] text-[#9CA3AF]">{new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
            </div>
          </div>
          <div className="space-y-3">
            {sections.map((s, i) => (
              <div key={s.t} className="bg-white rounded-3xl p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div className="flex items-start gap-3.5">
                  <span className="w-8 h-8 rounded-xl bg-[#F4F5F0] flex items-center justify-center text-[12px] font-bold text-[#6B7280] shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-bold text-[15px] text-[#1A1A1A] mb-1.5">{s.t}</h3>
                    <p className="text-[14px] text-[#6B7280] leading-[1.7]">{s.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
