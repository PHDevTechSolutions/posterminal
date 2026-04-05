"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, RefreshCw, Store, Palette, Phone, Home, ShoppingCart, Loader2, Megaphone, Filter, MessageCircle, Bell, CreditCard, Upload, X, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShopConfig, getShopConfig, saveShopConfig, resetShopConfig } from "@/lib/shop-config-service";

export default function ShopModificationPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("brand");
  const [uploading, setUploading] = useState<string | null>(null);

  // Upload file to Cloudinary
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      return data.url;
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
      return null;
    }
  };

  // Handle file input change
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    folder: string,
    onSuccess: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PNG, JPG, GIF, and WebP files are allowed");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(folder);
    const url = await uploadFile(file, folder);
    setUploading(null);

    if (url) {
      onSuccess(url);
      toast.success("File uploaded successfully!");
    }

    // Reset input
    e.target.value = "";
  };

  // Load config from Firebase on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const firebaseConfig = await getShopConfig();
      setConfig(firebaseConfig);
    } catch (error) {
      console.error("Error loading config:", error);
      toast.error("Failed to load configuration from Firebase");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      await saveShopConfig(config);
      toast.success("Configuration saved to Firebase!");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await resetShopConfig();
      const freshConfig = await getShopConfig();
      setConfig(freshConfig);
      toast.success("Configuration reset to defaults");
    } catch (error) {
      console.error("Error resetting config:", error);
      toast.error("Failed to reset configuration");
    } finally {
      setLoading(false);
    }
  };

  const updateBrand = (key: string, value: any) => {
    if (!config) return;
    setConfig(prev => prev ? {
      ...prev,
      brand: { ...prev.brand, [key]: value }
    } : null);
  };

  const updateContact = (key: string, value: any) => {
    if (!config) return;
    setConfig(prev => prev ? {
      ...prev,
      contact: { ...prev.contact, [key]: value }
    } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading configuration...</span>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load configuration</p>
          <Button onClick={loadConfig}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to POS
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-gray-700" />
              <h1 className="font-semibold text-lg">Shop Modification</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save to Firebase
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10 lg:w-fit">
            <TabsTrigger value="brand" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Brand</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Contact</span>
            </TabsTrigger>
            <TabsTrigger value="homepage" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Homepage</span>
            </TabsTrigger>
            <TabsTrigger value="cart" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
            </TabsTrigger>
            <TabsTrigger value="popup" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Popup</span>
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
          </TabsList>

          {/* Brand Tab */}
          <TabsContent value="brand" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Brand Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shop Name</Label>
                    <Input 
                      value={config.brand.name}
                      onChange={(e) => updateBrand("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tagline</Label>
                    <Input 
                      value={config.brand.tagline}
                      onChange={(e) => updateBrand("tagline", e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-4">Logo Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Emoji Logo</Label>
                      <Input 
                        value={config.brand.logo.emoji}
                        onChange={(e) => updateBrand("logo", { ...config.brand.logo, emoji: e.target.value })}
                        placeholder="🏪"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Logo Image</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={config.brand.logo.image || ""}
                          onChange={(e) => updateBrand("logo", { ...config.brand.logo, image: e.target.value || null })}
                          placeholder="Logo image URL"
                          className="flex-1"
                        />
                        <div className="relative">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.gif,.webp"
                            onChange={(e) => handleFileChange(e, "pos-logos", (url) => updateBrand("logo", { ...config.brand.logo, image: url }))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading === "pos-logos"}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploading === "pos-logos"}
                          >
                            {uploading === "pos-logos" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Upload PNG, JPG, GIF, or WebP (max 5MB)</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Initials</Label>
                      <Input 
                        value={config.brand.logo.initials}
                        onChange={(e) => updateBrand("logo", { ...config.brand.logo, initials: e.target.value })}
                        placeholder="YS"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Preview */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-4">Logo Preview</h3>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {config.brand.logo.emoji ? (
                      <span className="text-4xl">{config.brand.logo.emoji}</span>
                    ) : (
                      <div 
                        className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: config.brand.colors.primary }}
                      >
                        {config.brand.logo.initials}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{config.brand.name}</p>
                      <p className="text-sm text-gray-500">{config.brand.tagline}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Scheme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { key: "primary", label: "Primary" },
                    { key: "secondary", label: "Secondary" },
                    { key: "accent", label: "Accent" },
                    { key: "background", label: "Background" },
                    { key: "surface", label: "Surface" },
                  ].map(({ key, label }) => (
                    <div className="space-y-2" key={key}>
                      <Label>{label}</Label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={config.brand.colors[key as keyof typeof config.brand.colors]}
                          onChange={(e) => updateBrand("colors", { 
                            ...config.brand.colors, 
                            [key]: e.target.value 
                          })}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input 
                          value={config.brand.colors[key as keyof typeof config.brand.colors]}
                          onChange={(e) => updateBrand("colors", { 
                            ...config.brand.colors, 
                            [key]: e.target.value 
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Color Preview */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-4">Preview</h3>
                  <div 
                    className="p-6 rounded-lg" 
                    style={{ backgroundColor: config.brand.colors.background }}
                  >
                    <div 
                      className="p-4 rounded-lg mb-4" 
                      style={{ backgroundColor: config.brand.colors.surface }}
                    >
                      <p 
                        style={{ color: config.brand.colors.primary }} 
                        className="font-semibold mb-2"
                      >
                        Sample Card
                      </p>
                      <p 
                        style={{ color: config.brand.colors.secondary }} 
                        className="text-sm"
                      >
                        This is how your text will look
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="px-4 py-2 rounded text-white"
                        style={{ backgroundColor: config.brand.colors.primary }}
                      >
                        Primary Button
                      </button>
                      <button 
                        className="px-4 py-2 rounded text-white"
                        style={{ backgroundColor: config.brand.colors.accent }}
                      >
                        Success
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      value={config.contact.email}
                      onChange={(e) => updateContact("email", e.target.value)}
                      placeholder="support@yourshop.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      value={config.contact.phone}
                      onChange={(e) => updateContact("phone", e.target.value)}
                      placeholder="(123) 456-7890"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input 
                      value={config.contact.address}
                      onChange={(e) => updateContact("address", e.target.value)}
                      placeholder="123 Main Street, City, Country"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Homepage Tab */}
          <TabsContent value="homepage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Hero Section
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    value={config.homepage.hero.title}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      homepage: {
                        ...prev.homepage,
                        hero: { ...prev.homepage.hero, title: e.target.value }
                      }
                    } : null)}
                    placeholder="Welcome to {shopName}"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input 
                    value={config.homepage.hero.subtitle}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      homepage: {
                        ...prev.homepage,
                        hero: { ...prev.homepage.hero, subtitle: e.target.value }
                      }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button</Label>
                  <Input 
                    value={config.homepage.hero.ctaButton}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      homepage: {
                        ...prev.homepage,
                        hero: { ...prev.homepage.hero, ctaButton: e.target.value }
                      }
                    } : null)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cart Tab */}
          <TabsContent value="cart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cart Title</Label>
                  <Input 
                    value={config.cart.title}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      cart: { ...prev.cart, title: e.target.value }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Empty Message</Label>
                  <Input 
                    value={config.cart.emptyMessage}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      cart: { ...prev.cart, emptyMessage: e.target.value }
                    } : null)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Popup Banner Tab */}
          <TabsContent value="popup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Popup Banner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="showPopup"
                    checked={config.popupBanner.show}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      popupBanner: { ...prev.popupBanner, show: e.target.checked }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="showPopup">Enable Popup Banner</Label>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    value={config.popupBanner.title}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      popupBanner: { ...prev.popupBanner, title: e.target.value }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Input 
                    value={config.popupBanner.message}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      popupBanner: { ...prev.popupBanner, message: e.target.value }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input 
                    value={config.popupBanner.buttonText}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      popupBanner: { ...prev.popupBanner, buttonText: e.target.value }
                    } : null)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            {/* GCash Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  GCash Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="gcashEnabled"
                    checked={config.payment.gcash.enabled}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        gcash: { ...prev.payment.gcash, enabled: e.target.checked }
                      }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="gcashEnabled">Enable GCash Payment</Label>
                </div>
                <div className="space-y-2">
                  <Label>QR Code Image</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={config.payment.gcash.qrCodeUrl || ""}
                      onChange={(e) => setConfig(prev => prev ? {
                        ...prev,
                        payment: { 
                          ...prev.payment, 
                          gcash: { ...prev.payment.gcash, qrCodeUrl: e.target.value || null }
                        }
                      } : null)}
                      placeholder="https://your-cdn.com/gcash-qr.png"
                      className="flex-1"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.webp"
                        onChange={(e) => handleFileChange(e, "pos-qr-codes", (url) => setConfig(prev => prev ? {
                          ...prev,
                          payment: { 
                            ...prev.payment, 
                            gcash: { ...prev.payment.gcash, qrCodeUrl: url }
                          }
                        } : null))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading === "pos-qr-codes"}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploading === "pos-qr-codes"}
                      >
                        {uploading === "pos-qr-codes" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Upload PNG, JPG, GIF, or WebP (max 5MB)</p>
                </div>
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input 
                    value={config.payment.gcash.accountName}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        gcash: { ...prev.payment.gcash, accountName: e.target.value }
                      }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input 
                    value={config.payment.gcash.accountNumber}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        gcash: { ...prev.payment.gcash, accountNumber: e.target.value }
                      }
                    } : null)}
                    placeholder="09XXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Input 
                    value={config.payment.gcash.instructions}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        gcash: { ...prev.payment.gcash, instructions: e.target.value }
                      }
                    } : null)}
                  />
                </div>
                {/* QR Preview */}
                {config.payment.gcash.qrCodeUrl && (
                  <div className="border-t pt-4 mt-4">
                    <Label className="mb-2 block">QR Code Preview</Label>
                    <img 
                      src={config.payment.gcash.qrCodeUrl} 
                      alt="GCash QR Preview" 
                      className="w-48 h-48 object-contain border rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PayMaya Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  PayMaya Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="paymayaEnabled"
                    checked={config.payment.paymaya.enabled}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        paymaya: { ...prev.payment.paymaya, enabled: e.target.checked }
                      }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="paymayaEnabled">Enable PayMaya Payment</Label>
                </div>
                <div className="space-y-2">
                  <Label>QR Code Image</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={config.payment.paymaya.qrCodeUrl || ""}
                      onChange={(e) => setConfig(prev => prev ? {
                        ...prev,
                        payment: { 
                          ...prev.payment, 
                          paymaya: { ...prev.payment.paymaya, qrCodeUrl: e.target.value || null }
                        }
                      } : null)}
                      placeholder="https://your-cdn.com/paymaya-qr.png"
                      className="flex-1"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.webp"
                        onChange={(e) => handleFileChange(e, "pos-qr-codes", (url) => setConfig(prev => prev ? {
                          ...prev,
                          payment: { 
                            ...prev.payment, 
                            paymaya: { ...prev.payment.paymaya, qrCodeUrl: url }
                          }
                        } : null))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading === "pos-qr-codes-paymaya"}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploading === "pos-qr-codes-paymaya"}
                      >
                        {uploading === "pos-qr-codes-paymaya" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Upload PNG, JPG, GIF, or WebP (max 5MB)</p>
                </div>
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input 
                    value={config.payment.paymaya.accountName}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        paymaya: { ...prev.payment.paymaya, accountName: e.target.value }
                      }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input 
                    value={config.payment.paymaya.accountNumber}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        paymaya: { ...prev.payment.paymaya, accountNumber: e.target.value }
                      }
                    } : null)}
                    placeholder="09XXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Input 
                    value={config.payment.paymaya.instructions}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        paymaya: { ...prev.payment.paymaya, instructions: e.target.value }
                      }
                    } : null)}
                  />
                </div>
                {/* QR Preview */}
                {config.payment.paymaya.qrCodeUrl && (
                  <div className="border-t pt-4 mt-4">
                    <Label className="mb-2 block">QR Code Preview</Label>
                    <img 
                      src={config.payment.paymaya.qrCodeUrl} 
                      alt="PayMaya QR Preview" 
                      className="w-48 h-48 object-contain border rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cash on Delivery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Cash on Delivery (COD)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="codEnabled"
                    checked={config.payment.cod.enabled}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        cod: { ...prev.payment.cod, enabled: e.target.checked }
                      }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="codEnabled">Enable Cash on Delivery</Label>
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input 
                    value={config.payment.cod.label}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        cod: { ...prev.payment.cod, label: e.target.value }
                      }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    value={config.payment.cod.description}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        cod: { ...prev.payment.cod, description: e.target.value }
                      }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Additional Fee (₱)</Label>
                  <Input 
                    type="number"
                    value={config.payment.cod.fee}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        cod: { ...prev.payment.cod, fee: parseInt(e.target.value) || 0 }
                      }
                    } : null)}
                  />
                  <p className="text-xs text-gray-500">Set to 0 for free COD</p>
                </div>
              </CardContent>
            </Card>

            {/* Cash on Pickup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Cash on Pickup (COP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="copEnabled"
                    checked={config.payment.cop.enabled}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        cop: { ...prev.payment.cop, enabled: e.target.checked }
                      }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="copEnabled">Enable Cash on Pickup</Label>
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input 
                    value={config.payment.cop.label}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        cop: { ...prev.payment.cop, label: e.target.value }
                      }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    value={config.payment.cop.description}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      payment: { 
                        ...prev.payment, 
                        cop: { ...prev.payment.cop, description: e.target.value }
                      }
                    } : null)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="filters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Product Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="showFilters"
                    checked={config.filters.showFilters}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      filters: { ...prev.filters, showFilters: e.target.checked }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="showFilters">Show Filters on Products Page</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="showSorting"
                    checked={config.filters.sorting.show}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      filters: { 
                        ...prev.filters, 
                        sorting: { ...prev.filters.sorting, show: e.target.checked }
                      }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="showSorting">Show Sorting Options</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Live Chat Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="chatEnabled"
                    checked={config.chat.enabled}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      chat: { ...prev.chat, enabled: e.target.checked }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="chatEnabled">Enable Live Chat</Label>
                </div>
                <div className="space-y-2">
                  <Label>Welcome Message</Label>
                  <Input 
                    value={config.chat.welcomeMessage}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      chat: { ...prev.chat, welcomeMessage: e.target.value }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Auto-Reply Message</Label>
                  <Input 
                    value={config.chat.autoReplyMessage}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      chat: { ...prev.chat, autoReplyMessage: e.target.value }
                    } : null)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="autoReply"
                    checked={config.chat.autoReplyEnabled}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      chat: { ...prev.chat, autoReplyEnabled: e.target.checked }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="autoReply">Enable Auto-Reply</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="orderConfirmations"
                    checked={config.notifications.showOrderConfirmations}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, showOrderConfirmations: e.target.checked }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="orderConfirmations">Show Order Confirmations</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="promoNotifications"
                    checked={config.notifications.showPromoNotifications}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, showPromoNotifications: e.target.checked }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="promoNotifications">Show Promo Notifications</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="stockAlerts"
                    checked={config.notifications.showStockAlerts}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, showStockAlerts: e.target.checked }
                    } : null)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="stockAlerts">Show Stock Alerts</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
