import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        // Prevent MIME-type sniffing
        { key: "X-Content-Type-Options", value: "nosniff" },
        // Block clickjacking — page cannot be loaded in iframe
        { key: "X-Frame-Options", value: "DENY" },
        // Legacy XSS filter
        { key: "X-XSS-Protection", value: "1; mode=block" },
        // Limit referrer data
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // Block device APIs
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        // HSTS — force HTTPS for 1 year
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        // Prevent DNS prefetching leaks
        { key: "X-DNS-Prefetch-Control", value: "off" },
        // Cross-Origin policies
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        // Content Security Policy
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // Next.js needs unsafe-inline for styled-jsx; unsafe-eval for dev only
            "script-src 'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com https://*.googleapis.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            // Only allow images from self, data URIs, Google (profile pics), and blob (CSV)
            "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.google.com https://*.googleusercontent.com",
            // Only allow connections to Firebase/Google
            "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com",
            // Only allow iframes from Firebase auth popup
            "frame-src https://*.firebaseapp.com https://accounts.google.com",
            // Block all plugins/objects
            "object-src 'none'",
            // Restrict base tag
            "base-uri 'self'",
            // Restrict form submissions to same origin
            "form-action 'self'",
            // Block all frame ancestors (anti-clickjacking via CSP)
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
