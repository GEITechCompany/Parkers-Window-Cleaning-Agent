import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { AuthProvider } from "./auth/AuthContext";

export const metadata: Metadata = {
  title: "Window Cleaning Scheduling System",
  description: "A modular scheduling system for window cleaning services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
