import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const s3PublicBase = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["tesseract.js", "pdf-parse", "pdfjs-dist", "@aws-sdk/client-s3"],
  outputFileTracingIncludes: {
    "/*": [
      "./src/generated/prisma/**/*",
      "./node_modules/@prisma/adapter-pg/**/*",
      "./node_modules/pg/**/*",
    ],
    "/api/health": [
      "./src/generated/prisma/**/*",
      "./node_modules/@prisma/adapter-pg/**/*",
      "./node_modules/pg/**/*",
    ],
    "/api/purchases/invoice-import": [
      "./node_modules/tesseract.js/**/*",
      "./node_modules/tesseract.js-core/**/*",
      "./node_modules/pdf-parse/**/*",
      "./node_modules/pdfjs-dist/**/*",
      "./node_modules/bmp-js/**/*",
      "./node_modules/wasm-feature-detect/**/*",
      "./node_modules/zlibjs/**/*",
    ],
    "/api/purchases/invoice-import/[id]/reprocess": [
      "./node_modules/tesseract.js/**/*",
      "./node_modules/tesseract.js-core/**/*",
      "./node_modules/pdf-parse/**/*",
      "./node_modules/pdfjs-dist/**/*",
      "./node_modules/bmp-js/**/*",
      "./node_modules/wasm-feature-detect/**/*",
      "./node_modules/zlibjs/**/*",
    ],
  },
  images: {
    remotePatterns: s3PublicBase
      ? [
          {
            protocol: "https",
            hostname: new URL(s3PublicBase).hostname,
            pathname: "/**",
          },
        ]
      : [],
    unoptimized: process.env.NODE_ENV !== "production",
  },
  async rewrites() {
    if (process.env.UPLOAD_STORAGE === "s3" && s3PublicBase) {
      return [
        {
          source: "/uploads/:path*",
          destination: `${s3PublicBase}/uploads/:path*`,
        },
      ];
    }
    return [];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
