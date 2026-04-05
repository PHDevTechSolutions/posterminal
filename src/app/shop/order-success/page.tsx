"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag, Loader2 } from "lucide-react";
import { useShopConfig } from "@/context/ShopConfigContext";

export default function OrderSuccessPage() {
  const { config, loading } = useShopConfig();

  if (loading || !config) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { brand, orderSuccess } = config;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-md mx-auto">
        <div 
          className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: brand.colors.accent + '20' }}
        >
          <CheckCircle className="h-10 w-10" style={{ color: brand.colors.accent }} />
        </div>
        
        <h1 className="text-3xl font-semibold mb-2" style={{ color: brand.colors.primary }}>
          {orderSuccess.title}
        </h1>
        <p className="text-gray-500 mb-2">{orderSuccess.message}</p>
        <p className="text-gray-400 text-sm mb-8">{orderSuccess.subMessage}</p>

        <div className="rounded-xl p-6 mb-8 text-left" style={{ backgroundColor: brand.colors.surface }}>
          <h3 className="font-medium mb-2" style={{ color: brand.colors.primary }}>
            {orderSuccess.nextSteps.title}
          </h3>
          <ul className="text-sm text-gray-500 space-y-2">
            {orderSuccess.nextSteps.steps.map((step, index) => (
              <li key={index}>{index + 1}. {step}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={orderSuccess.buttons.primary.link}>
            <Button style={{ backgroundColor: brand.colors.primary }} className="hover:opacity-90">
              <ShoppingBag className="mr-2 h-4 w-4" />
              {orderSuccess.buttons.primary.text}
            </Button>
          </Link>
          <Link href={orderSuccess.buttons.secondary.link}>
            <Button variant="outline" style={{ borderColor: brand.colors.primary, color: brand.colors.primary }}>
              {orderSuccess.buttons.secondary.text}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
