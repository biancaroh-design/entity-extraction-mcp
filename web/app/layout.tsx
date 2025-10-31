import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entity 추출 MCP",
  description: "대화에서 Entity를 추출하고 즉시 액션으로 연결",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-dark antialiased">{children}</body>
    </html>
  );
}
