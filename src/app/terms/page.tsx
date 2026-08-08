import Link from "next/link";

export const metadata = { title: "Terms of Use — Orbit" };

export default function TermsPage() {
  const sections = [
    {
      t: "Acceptance",
      d: "By accessing or using Orbit, you agree to these Terms of Use. If you do not agree, please stop using the service. These terms apply to all users, visitors, and account holders.",
    },
    {
      t: "Service Description",
      d: "Orbit is a cloud-based lead management application operated by Sita Enterprises Pvt. Ltd. It helps teams capture, organize, update, and follow up on leads and sales opportunities.",
    },
    {
      t: "Accounts & Authentication",
      d: "Access to Orbit requires Google sign-in. You are responsible for maintaining the security of your account and for all activity that occurs under it. Do not share account access with unauthorized users.",
    },
    {
      t: "User Responsibilities",
      d: "You agree to provide accurate information, use Orbit only for lawful business purposes, avoid abusive or unauthorized behavior, and refrain from attempting to access data belonging to other users.",
    },
    {
      t: "Customer Data Ownership",
      d: "All leads, notes, and follow-up data you create in Orbit remain your property. We do not claim ownership of your business data. You may export your data using the in-app export tools.",
    },
    {
      t: "Acceptable Use",
      d: "You must not upload malicious content, abuse the service, scrape other users’ information, reverse engineer protected systems, or use Orbit in violation of law or regulation.",
    },
    {
      t: "Availability",
      d: "We aim to provide a stable and reliable service, but uninterrupted availability is not guaranteed. Maintenance, third-party outages, browser issues, and network failures may temporarily affect access.",
    },
    {
      t: "Intellectual Property",
      d: "Orbit’s interface, software, trademarks, logos, documentation, and overall product design are the property of Sita Enterprises Pvt. Ltd. and are protected by applicable intellectual property laws.",
    },
    {
      t: "Limitation of Liability",
      d: "Orbit is provided on an “as is” and “as available” basis. To the maximum extent permitted by law, Sita Enterprises Pvt. Ltd. is not liable for indirect, incidental, consequential, or special damages arising from use of the service.",
    },
    {
      t: "Termination",
      d: "We may suspend or terminate access if these terms are violated or if security concerns arise. You may stop using the service at any time. Data may be removed after account termination in line with our retention practices.",
    },
    {
      t: "Changes to Terms",
      d: "We may revise these Terms of Use from time to time. Continued use of Orbit after changes become effective constitutes acceptance of the updated terms.",
    },
    {
      t: "Contact",
      d: "For support, legal, or compliance questions, contact Sita Enterprises Pvt. Ltd. at sitaenterprisespvtltd@gmail.com.",
    },
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] uppercase tracking-[0.12em] text-[#9CA3AF] font-semibold mb-2">Legal</p>
                <h1 className="text-[24px] font-extrabold text-[#1A1A1A] tracking-tight mb-2">Terms of Use</h1>
                <p className="text-[14px] text-[#6B7280] leading-relaxed max-w-[28rem]">
                  These terms explain how Orbit may be used, what responsibilities users have,
                  and how Sita Enterprises Pvt. Ltd. handles access to the service.
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#3B5BDB]/10 flex items-center justify-center text-[#3B5BDB] shrink-0">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#F3F4F0] grid grid-cols-2 gap-4 text-[12px]">
              <div>
                <p className="text-[#BFBFBF]">Operator</p>
                <p className="text-[#1A1A1A] font-medium mt-0.5">Sita Enterprises Pvt. Ltd.</p>
              </div>
              <div>
                <p className="text-[#BFBFBF]">Contact</p>
                <p className="text-[#1A1A1A] font-medium mt-0.5 break-all">sitaenterprisespvtltd@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {sections.map((s, i) => (
              <div key={s.t} className="bg-white rounded-3xl p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div className="flex items-start gap-3.5">
                  <span className="w-8 h-8 rounded-xl bg-[#F4F5F0] flex items-center justify-center text-[12px] font-bold text-[#6B7280] shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-bold text-[15px] text-[#1A1A1A] mb-1.5">{s.t}</h3>
                    <p className="text-[14px] text-[#6B7280] leading-[1.75]">{s.d}</p>
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
