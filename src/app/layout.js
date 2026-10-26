import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export const metadata = {
  title: "Ananya Hi Solutions | Professional Web Design & Digital Marketing Agency",
  description: "Ananya Hi Solutions is a premium Web Design & Digital Marketing agency in Hyderabad, delivering creative solutions that help businesses grow online.",
  keywords: "web design, digital marketing, mobile application, ecommerce application, video production, software development, Hyderabad, digital agency",
  verification: {
    google: "o9CzPZe5yYKxmxiKsdximDoMMw2m95F2lm8brnJGc1s",
  },
};

import { ServicesProvider } from "./context/ServicesContext";

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${outfit.variable} h-full scroll-smooth`}
      suppressHydrationWarning={true}
    >
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (sessionStorage.getItem('ahs_splash_shown')) {
              document.documentElement.classList.add('splash-skip');
            }
          } catch (e) {}
        `}} />
      </head>
      <body className="min-h-full font-sans antialiased bg-slate-50 text-slate-900 transition-colors duration-300">
        <ServicesProvider>
          {children}
        </ServicesProvider>
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
