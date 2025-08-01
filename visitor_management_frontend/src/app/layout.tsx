import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visitor Kiosk",
  description: "Modern, accessible visitor management kiosk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Adds Material Icons for UI */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Branded header for all pages */}
        <header className="brand-header" role="banner" aria-label="Company brand and site title">
          <span className="brand-logo" aria-hidden="true">VK</span>
          Visitor Kiosk
        </header>
        {/* Main region for accessibility */}
        <main id="main" aria-label="Visitor Kiosk Main Content" tabIndex={-1}>
          <div className="kiosk-wrapper">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
