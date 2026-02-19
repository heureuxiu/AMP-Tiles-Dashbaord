import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AMP Tiles Admin",
  description: "AMP Tiles Australia - Admin Dashboard",
  openGraph: {
    title: "AMP Tiles Admin",
    description: "AMP Tiles Australia - Admin Dashboard",
    siteName: "AMP Tiles Australia",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} min-w-0 overflow-x-hidden font-sans antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <Toaster position="top-center" closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
