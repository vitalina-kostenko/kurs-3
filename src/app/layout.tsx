import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Massage Center - Resource & Service Management",
  description: "Information system for managing resources and services of a massage center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
