import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "TikTok Account Manager & Automation Platform",
  description: "Hệ thống quản lý hàng nghìn tài khoản TikTok, Host Mail, Email và Tự động hóa tập trung",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-background text-foreground antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

