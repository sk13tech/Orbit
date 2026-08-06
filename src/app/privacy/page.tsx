import Link from "next/link";

export const metadata = { title: "Privacy Policy — Orbit" };

export default function PrivacyPage() {
  const sections = [
    { t: "Information We Collect", d: "We collect the following data when you use Orbit: your Google account information (name, email, profile picture) for authentication; lead data including contact names, phone numbers, products, dates, and notes; follow-up logs and remarks; and basic usage analytics." },
    { t: "How We Use Your Information", d: "Your data is used exclusively to provide lead management functionality, generate analytics and performance reports within your account, improve the application experience, and ensure account security. We never use your data for advertising." },
    { t: "Data Storage & Security", d: "All data is stored securely in Google Firebase/Firestore with encryption at rest and in transit. Authentication is handled via Google OAuth 2.0. We implement industry-standard security measures including access controls, audit logging, and regular security reviews." },
    { t: "Data Isolation", d: "Your data is completely isolated from other users. Firestore security rules ensure that only you can read, create, update, or delete your own leads and logs. No other user or administrator can access your data without explicit authorization." },
    { t: "Data Sharing", d: "Orbit does not sell, trade, rent, or share your personal data with any third parties. Data may only be disclosed when required by law, to protect our legal rights, or with your explicit written consent." },
    { t: "Data Retention & Deletion", d: "Your data is retained as long as your account is active. You may export your data at any time using the CSV export feature. You can request complete account and data deletion by contacting us. All data will be permanently removed within 30 days of a deletion request." },
    { t: "Your Rights", d: "Under applicable data protection laws, you have the right to: access all your personal data, correct any inaccurate data, request complete data deletion, export your data in CSV format, withdraw consent at any time, and lodge a complaint with a data protection authority." },
    { t: "Cookies & Local Storage", d: "Orbit uses browser local storage to maintain your authentication session. We do not use third-party tracking cookies. Firebase may use essential cookies for authentication and security purposes only." },
    { t: "Children's Privacy", d: "Orbit is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately." },
    { t: "Changes to This Policy", d: "We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. Material changes will be communicated through the application. Continued use after changes constitutes acceptance of the revised policy." },
    { t: "Contact Us", d: "For any privacy-related questions, concerns, data access requests, or deletion requests, please contact our data protection team at sitaenterprisespvtltd@gmail.com" },
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
            <div className="w-12 h-12 rounded-2xl bg-[#2B8A3E]/10 flex items-center justify-center text-[#2B8A3E] mb-4">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <h1 className="text-[24px] font-extrabold text-[#1A1A1A] tracking-tight mb-2">Privacy Policy</h1>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">Your privacy matters to us. This policy explains how Sita Enterprises Pvt. Ltd. collects, uses, and protects your personal information when you use Orbit.</p>
            <div className="mt-4 pt-3 border-t border-[#F3F4F0] flex items-center justify-between">
              <p className="text-[12px] text-[#9CA3AF]">Orbit</p>
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
