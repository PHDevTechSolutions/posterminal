"use client";

import Link from "next/link";
import Image from "next/image";
import { useShop } from "@/context/ShopContext";
import { useShopConfig } from "@/context/ShopConfigContext";
import { ShoppingCart, Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ShopHeader() {
  const { cartCount } = useShop();
  const { config, loading } = useShopConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Show loading state while config is loading
  if (loading || !config) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <div className="animate-pulse h-8 w-32 bg-gray-200 rounded" />
        </div>
      </header>
    );
  }

  const { brand, header, contact } = config;

  const Logo = () => {
    if (brand.logo.image) {
      return (
        <Image 
          src={brand.logo.image} 
          alt={brand.name} 
          width={32} 
          height={32} 
          className="rounded-lg"
        />
      );
    }
    
    if (brand.logo.emoji) {
      return <span className="text-2xl">{brand.logo.emoji}</span>;
    }
    
    return (
      <div 
        className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: brand.colors.primary }}
      >
        {brand.logo.initials}
      </div>
    );
  };

  return (
    <header 
      className={`${header.stickyHeader ? 'sticky top-0' : ''} z-50 bg-white border-b`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/shop" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold text-lg" style={{ color: brand.colors.primary }}>
              {brand.name}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {header.navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors hover:text-black"
                style={{ color: brand.colors.secondary }}
              >
                {link.label}
                {link.showCartCount && cartCount > 0 && (
                  <span 
                    className="ml-1 text-xs px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: brand.colors.primary }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Side: Search & Cart */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {header.showSearch && (
              <div className="hidden md:flex items-center relative">
                <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 w-48"
                  style={{ borderColor: brand.colors.secondary + '30' }}
                />
              </div>
            )}

            {/* Cart */}
            {header.showCartIcon && (
              <Link href="/shop/cart">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative"
                  style={{ color: brand.colors.secondary }}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 h-5 w-5 text-white text-xs rounded-full flex items-center justify-center"
                      style={{ backgroundColor: brand.colors.primary }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: brand.colors.secondary }}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            {/* Mobile Search */}
            {header.showSearch && (
              <div className="px-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg"
                  />
                </div>
              </div>
            )}
            
            {/* Mobile Nav Links */}
            {header.navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-sm"
                style={{ color: brand.colors.secondary }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center justify-between">
                  {link.label}
                  {link.showCartCount && cartCount > 0 && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: brand.colors.primary }}
                    >
                      {cartCount}
                    </span>
                  )}
                </span>
              </Link>
            ))}

            {/* Contact Info in Mobile Menu */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-400 px-4">Contact us:</p>
              <p className="text-sm px-4 mt-1" style={{ color: brand.colors.secondary }}>
                {contact.phone}
              </p>
              <p className="text-sm px-4" style={{ color: brand.colors.secondary }}>
                {contact.email}
              </p>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
