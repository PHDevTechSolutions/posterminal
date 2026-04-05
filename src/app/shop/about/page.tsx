"use client";

import { useShopConfig } from "@/context/ShopConfigContext";
import { formatShopText } from "@/config/shop.config";
import { Loader2 } from "lucide-react";

export default function AboutPage() {
  const { config, loading } = useShopConfig();

  if (loading || !config) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { brand, about, contact } = config;
  const heroTitle = formatShopText(about.hero.title, brand.name);
  const storyContent = formatShopText(about.story.content, brand.name);
  const missionContent = formatShopText(about.mission.content, brand.name);
  const visionContent = formatShopText(about.vision.content, brand.name);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 
          className="text-4xl font-light mb-4"
          style={{ color: brand.colors.primary }}
        >
          {heroTitle}
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          {about.hero.subtitle}
        </p>
      </div>

      {/* Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: brand.colors.primary }}>
            {about.story.title}
          </h2>
          <p className="text-gray-500 leading-relaxed mb-4">
            {storyContent}
          </p>
          
          {/* Timeline */}
          {about.story.highlights && (
            <div className="mt-6 space-y-4">
              {about.story.highlights.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span 
                    className="text-sm font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: brand.colors.primary + '10', color: brand.colors.primary }}
                  >
                    {item.year}
                  </span>
                  <span className="text-gray-600">{item.event}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div 
          className="rounded-2xl h-64 flex items-center justify-center"
          style={{ backgroundColor: brand.colors.surface }}
        >
          <span className="text-6xl">{brand.logo.emoji}</span>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="p-8 rounded-xl" style={{ backgroundColor: brand.colors.surface }}>
          <h2 className="text-xl font-semibold mb-3" style={{ color: brand.colors.primary }}>
            {about.mission.title}
          </h2>
          <p className="text-gray-500">{missionContent}</p>
        </div>
        <div className="p-8 rounded-xl" style={{ backgroundColor: brand.colors.surface }}>
          <h2 className="text-xl font-semibold mb-3" style={{ color: brand.colors.primary }}>
            {about.vision.title}
          </h2>
          <p className="text-gray-500">{visionContent}</p>
        </div>
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 
          className="text-2xl font-semibold mb-8 text-center"
          style={{ color: brand.colors.primary }}
        >
          {about.values.title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {about.values.items.map((value, index) => (
            <div 
              key={index} 
              className="text-center p-6 rounded-xl"
              style={{ backgroundColor: brand.colors.surface }}
            >
              <div className="text-4xl mb-4">{value.icon}</div>
              <h3 className="font-semibold mb-2" style={{ color: brand.colors.primary }}>
                {value.title}
              </h3>
              <p className="text-sm text-gray-500">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      {about.contact.show && (
        <div 
          className="text-center rounded-2xl p-12 text-white"
          style={{ backgroundColor: brand.colors.primary }}
        >
          <h2 className="text-2xl font-semibold mb-4">{about.contact.title}</h2>
          <p className="text-gray-300 mb-6">{about.contact.subtitle}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm">
            <div>
              <span className="text-gray-400">Email:</span>{" "}
              <a href={`mailto:${contact.email}`} className="hover:underline">
                {contact.email}
              </a>
            </div>
            <div>
              <span className="text-gray-400">Phone:</span>{" "}
              <a href={`tel:${contact.phone}`} className="hover:underline">
                {contact.phone}
              </a>
            </div>
            <div>
              <span className="text-gray-400">Address:</span> {contact.address}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
