import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AMP Tiles Admin",
  description: "AMP Tiles Australia - Admin Dashboard",
  icons: {
    icon: "/assets/AMP-TILES-LOGO.png",
    shortcut: "/assets/AMP-TILES-LOGO.png",
    apple: "/assets/AMP-TILES-LOGO.png",
  },
  openGraph: {
    title: "AMP Tiles Admin",
    description: "AMP Tiles Australia - Admin Dashboard",
    images: ["/assets/AMP-TILES-LOGO.png"],
    siteName: "AMP Tiles Australia",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AMP Tiles Admin",
    description: "AMP Tiles Australia - Admin Dashboard",
    images: ["/assets/AMP-TILES-LOGO.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster position="top-center" closeButton />
      </body>
    </html>
  );
}
