"use client";

import { useShop } from "@/context/ShopContext";
import { useShopConfig } from "@/context/ShopConfigContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart, Search, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ProductsPage() {
  const { menuItems, loading: itemsLoading, addToCart } = useShop();
  const { config, loading: configLoading } = useShopConfig();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const loading = itemsLoading || configLoading;

  if (loading || !config) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { brand, products } = config;

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.stock > 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: brand.colors.primary }}>
          {products.title}
        </h1>
        <p className="text-gray-500">{products.subtitle}</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {products.showSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        {products.showCategories && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {products.categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                style={selectedCategory === cat ? { backgroundColor: brand.colors.primary } : {}}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {itemsLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-4" />
          <p>No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm bg-gray-50">
              <CardContent className="p-4">
                <div 
                  className="aspect-square rounded-lg mb-3 flex items-center justify-center"
                  style={{ backgroundColor: brand.colors.surface }}
                >
                  <Package className="h-8 w-8" style={{ color: brand.colors.secondary }} />
                </div>
                <Badge 
                  variant="secondary" 
                  className="mb-2 text-xs"
                  style={{ backgroundColor: brand.colors.primary + '10', color: brand.colors.primary }}
                >
                  {item.category}
                </Badge>
                <h3 className="font-medium text-sm mb-1 line-clamp-1" style={{ color: brand.colors.primary }}>
                  {item.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: brand.colors.primary }}>₱{item.price}</span>
                  {products.showStockCount && (
                    <span className="text-xs text-gray-400">
                      {item.stock <= products.lowStockThreshold 
                        ? products.lowStockMessage.replace('{count}', item.stock.toString())
                        : `${item.stock} left`
                      }
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full mt-3 hover:opacity-90"
                  style={{ backgroundColor: brand.colors.primary }}
                  onClick={() => addToCart(item)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {products.addToCartButton}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
