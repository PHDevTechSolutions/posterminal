"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Truck, Shield, Loader2 } from "lucide-react";
import { useShopConfig } from "@/context/ShopConfigContext";
import { formatShopText } from "@/config/shop.config";

// Map icon names to components
const IconMap: Record<string, React.ReactNode> = {
  Package: <Package className="h-6 w-6" />,
  Truck: <Truck className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
};

export default function ShopHomePage() {
  const { config, loading } = useShopConfig();

  if (loading || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { brand, homepage } = config;
  const heroTitle = formatShopText(homepage.hero.title, brand.name);

  // Update icon colors based on brand
  const IconMapWithColors: Record<string, React.ReactNode> = {
    Package: <Package className="h-6 w-6" style={{ color: brand.colors.primary }} />,
    Truck: <Truck className="h-6 w-6" style={{ color: brand.colors.primary }} />,
    Shield: <Shield className="h-6 w-6" style={{ color: brand.colors.primary }} />,
  };

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="py-20"
        style={{ 
          backgroundColor: homepage.hero.backgroundImage ? undefined : brand.colors.surface,
          backgroundImage: homepage.hero.backgroundImage ? `url(${homepage.hero.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h1 
              className="text-4xl font-light mb-4"
              style={{ color: brand.colors.primary }}
            >
              {heroTitle}
            </h1>
            <p className="text-gray-500 mb-8">
              {homepage.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={homepage.hero.ctaLink}>
                <Button 
                  size="lg" 
                  style={{ backgroundColor: brand.colors.primary }}
                  className="hover:opacity-90"
                >
                  {homepage.hero.ctaButton}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              {homepage.hero.showSecondaryButton && (
                <Link href={homepage.hero.secondaryLink || "/shop/cart"}>
                  <Button 
                    size="lg" 
                    variant="outline"
                    style={{ borderColor: brand.colors.primary, color: brand.colors.primary }}
                  >
                    {homepage.hero.secondaryButton || "View Cart"}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" style={{ backgroundColor: brand.colors.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            className="text-2xl font-semibold text-center mb-12"
            style={{ color: brand.colors.primary }}
          >
            {homepage.features.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {homepage.features.items.map((feature, index) => (
              <div 
                key={index} 
                className="text-center p-6 rounded-xl"
                style={{ backgroundColor: brand.colors.surface }}
              >
                <div 
                  className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: brand.colors.primary + '10' }}
                >
                  {IconMapWithColors[feature.icon] || <Package className="h-6 w-6" />}
                </div>
                <h3 className="font-medium mb-2" style={{ color: brand.colors.primary }}>
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      {homepage.promoBanner.show && (
        <section 
          className="py-16 text-white"
          style={{ backgroundColor: homepage.promoBanner.backgroundColor }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-light mb-4">{homepage.promoBanner.title}</h2>
            <p className="text-gray-300 mb-6">{homepage.promoBanner.description}</p>
            <Link href="/shop/products">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-gray-900"
              >
                {homepage.promoBanner.buttonText}
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
