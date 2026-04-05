"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ShopConfig, getShopConfig, saveShopConfig } from "@/lib/shop-config-service";
import { shopConfig as defaultConfig } from "@/config/shop.config";
import { toast } from "sonner";

interface ShopConfigContextType {
  config: ShopConfig;
  loading: boolean;
  saveConfig: (newConfig: ShopConfig) => Promise<void>;
  resetConfig: () => Promise<void>;
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
}

const ShopConfigContext = createContext<ShopConfigContextType | undefined>(undefined);

export function ShopConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ShopConfig>(defaultConfig as ShopConfig);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

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
      console.error("Error loading shop config:", error);
      toast.error("Failed to load shop configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: ShopConfig) => {
    try {
      await saveShopConfig(newConfig);
      setConfig(newConfig);
      setIsDirty(false);
      toast.success("Configuration saved to Firebase!");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
      throw error;
    }
  };

  const resetConfig = async () => {
    try {
      await saveShopConfig(defaultConfig as ShopConfig);
      setConfig(defaultConfig as ShopConfig);
      setIsDirty(false);
      toast.success("Configuration reset to defaults");
    } catch (error) {
      console.error("Error resetting config:", error);
      toast.error("Failed to reset configuration");
      throw error;
    }
  };

  return (
    <ShopConfigContext.Provider value={{
      config,
      loading,
      saveConfig,
      resetConfig,
      isDirty,
      setIsDirty
    }}>
      {children}
    </ShopConfigContext.Provider>
  );
}

export function useShopConfig() {
  const context = useContext(ShopConfigContext);
  if (context === undefined) {
    throw new Error("useShopConfig must be used within a ShopConfigProvider");
  }
  return context;
}
