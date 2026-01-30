import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Custom Bottle Design - E-commerce",
  description: "Design and order custom bottle labels with our 3D design engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#1E1E1E]">
      <body
        className={`${poppins.variable} font-sans antialiased bg-[#1E1E1E]`}
      >
        {children}
      </body>
    </html>
  );
}
