import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Federal Events | Mission calendar",
  description: "Internal federal customer and association event tracker"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
