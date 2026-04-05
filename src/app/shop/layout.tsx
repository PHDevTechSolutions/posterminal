import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ShopProvider } from "@/context/ShopContext";
import { ShopConfigProvider } from "@/context/ShopConfigContext";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopFooter } from "@/components/shop/ShopFooter";
import { ChatWidget } from "@/components/shop/ChatWidget";
import { PopupBanner } from "@/components/shop/PopupBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shop - Order Online",
  description: "Order your favorite products online",
};

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ShopConfigProvider>
      <ShopProvider>
        <html lang="en">
          <body className={inter.className}>
            <div className="min-h-screen flex flex-col bg-white">
              <ShopHeader />
              <main className="flex-1">{children}</main>
              <ShopFooter />
              <ChatWidget />
              <PopupBanner />
            </div>
            <Toaster />
          </body>
        </html>
      </ShopProvider>
    </ShopConfigProvider>
  );
}
