import type { Metadata } from "next";
import { Noto_Sans_KR, Nanum_Myeongjo } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

const nanumMyeongjo = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-nanum-myeongjo",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "소소.소, 소소한 소식",
    template: "%s | 소소.소",
  },
  description:
    "좋은 소식을 만날 때마다, 마음이 따뜻해지는 소소한 소식을 골라 전합니다. 전문적인 시선과 따뜻한 마음으로 다시 쓴 좋은 뉴스 아카이브.",
  openGraph: {
    title: "소소.소, 소소한 소식",
    description: "좋은 소식을 만날 때마다, 마음이 따뜻해지는 소소한 소식을 골라 전합니다.",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: "https://cdn.tensemovement.com/sososo/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "소소.소, 소소한 소식",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${nanumMyeongjo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper">{children}</body>
    </html>
  );
}
