import Link from "next/link";

export const metadata = { title: "Privacy Policy — Orbit" };

export default function PrivacyPage() {
  const sections = [
    {
      t: "Information We Collect",
      d: "We collect account profile information provided through Google Authentication, along with lead data, notes, follow-up logs, and analytics metadata needed to operate Orbit.",
    },
    {
      t: "How We Use Data",
      d: "Your data is used to authenticate your account, provide lead management features, generate in-app statistics, support export tools, improve reliability, and maintain product security.",
    },
    {
      t: "Storage & Security",
      d: "Orbit stores application data using Firebase/Firestore and applies access controls through Firebase Authentication and Firestore Security Rules. We use reasonable technical measures to protect your information.",
    },
    {
      t: "User Data Isolation",
      d: "Each user can only access, edit, and manage their own leads and logs. Access to records is restricted by authenticated user identity and ownership checks in both application logic and Firestore rules.",
    },
    {
      t: "Sharing of Information",
      d: "We do not sell or rent your personal or business data. Information is shared only when necessary to provide the service, comply with legal obligations, or protect the rights and safety of the service and its users.",
    },
    {
      t: "Retention",
      d: "Data is retained while your account remains active or as needed to provide the service. You may request deletion of your account data, subject to any lawful retention obligations.",
    },
    {
      t: "Your Rights",
      d: "You may review, update, export, or request deletion of your data. You may also contact us regarding privacy concerns, security questions, or data handling requests.",
    },
    {
      t: "Cookies & Session Storage",
      d: "Orbit may use browser storage and authentication persistence required for login sessions and product functionality. We do not use third-party advertising or tracking cookies inside the application experience.",
    },
    {
      t: "Third-Party Services",
      d: "Orbit relies on Google/Firebase services for authentication and data infrastructure. Your use of Google sign-in may also be subject to Google’s own terms and privacy practices.",
    },
    {
      t: "Policy Changes",
      d: "We may revise this Privacy Policy from time to time. When significant changes are made, the updated policy will be reflected in the application with a revised effective date.",
    },
    {
      t: "Contact",
      d: "For privacy questions, requests, or concerns, contact Sita Enterprises Pvt. Ltd. at sitaenterprisespvtltd@gmail.com.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F0]">
      <div className="max-w-lg mx-auto pb-10">
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm px-5 py-3.5 flex items-center gap-3" style={{ boxShadow: "0 1px 0 #ECEEE8" }}>
          <Link href="/" className="p-1.5 -ml-1.5 rounded-xl text-[#9CA3AF] active:scale-90 transition-transform">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <span className="text-[16px] font-bold text-[#1A1A1A]">Privacy Policy</span>
        </div>

        <div className="px-4 pt-5">
          <div className="bg-white rounded-3xl p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] uppercase tracking-[0.12em] text-[#9CA3AF] font-semibold mb-2">Privacy</p>
                <h1 className="text-[24px] font-extrabold text-[#1A1A1A] tracking-tight mb-2">Privacy Policy</h1>
                <p className="text-[14px] text-[#6B7280] leading-relaxed max-w-[28rem]">
                  This page describes how Orbit handles your data, protects account privacy,
                  and limits access so users only manage their own records.
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#2B8A3E]/10 flex items-center justify-center text-[#2B8A3E] shrink-0">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
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
