"use client";

import Link from "next/link";
import Image from "next/image";
import { useShopConfig } from "@/context/ShopConfigContext";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";

export function ShopFooter() {
  const { config, loading } = useShopConfig();

  if (loading || !config) {
    return (
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </footer>
    );
  }

  const { brand, footer, contact } = config;
  const currentYear = new Date().getFullYear();

  const Logo = () => {
    if (brand.logo.image) {
      return <Image src={brand.logo.image} alt={brand.name} width={40} height={40} className="rounded-lg" />;
    }
    if (brand.logo.emoji) {
      return <span className="text-3xl">{brand.logo.emoji}</span>;
    }
    return (
      <div 
        className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: brand.colors.primary }}
      >
        {brand.logo.initials}
      </div>
    );
  };

  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {footer.columns.map((column: any, index: number) => {
            if (column.type === "text") {
              return (
                <div key={index}>
                  <div className="flex items-center gap-2 mb-4">
                    <Logo />
                    <h3 className="font-semibold text-lg">{brand.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {column.content}
                  </p>
                </div>
              );
            }

            if (column.type === "links") {
              return (
                <div key={index}>
                  <h4 className="font-medium mb-4">{column.title}</h4>
                  <ul className="space-y-2">
                    {column.links?.map((link: any, linkIndex: number) => (
                      <li key={linkIndex}>
                        <Link 
                          href={link.href} 
                          className="text-sm text-gray-500 hover:text-black transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }

            if (column.type === "contact") {
              return (
                <div key={index}>
                  <h4 className="font-medium mb-4">{column.title}</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm text-gray-500">
                      <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{contact.phone}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-500">
                      <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{contact.email}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{contact.address}</span>
                    </li>
                  </ul>

                  {/* Social Media */}
                  {column.showSocial && contact.socialMedia && (
                    <div className="flex gap-3 mt-4">
                      {Object.entries(contact.socialMedia).map(([platform, url]) => {
                        if (!url) return null;
                        return (
                          <a
                            key={platform}
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors capitalize"
                          >
                            {platform[0].toUpperCase()}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Bottom Bar */}
        {footer.bottomBar.show && (
          <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              {footer.bottomBar.copyright
                .replace("{shopName}", brand.name)
                .replace("{year}", currentYear.toString())}
            </p>
            <div className="flex gap-6">
              {footer.bottomBar.extraLinks?.map((link: any, index: number) => (
                <Link 
                  key={index}
                  href={link.href} 
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
