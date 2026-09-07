import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tra cứu thông tin",
  description: "Quản lý KPI và thông tin Staff",
  metadataBase: new URL("https://checkluong.vercel.app"),

  openGraph: {
    title: "Tra cứu thông tin",
    description: "Quản lý KPI và thông tin Staff",
    url: "https://checkluong.vercel.app",
    type: "website",
    images: [
      {
        url: "/og-image-v2.png",
        width: 1200,
        height: 630,
        alt: "Tra cứu thông tin",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Tra cứu thông tin",
    description: "Quản lý KPI và thông tin Staff",
    images: ["/og-image-v2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}