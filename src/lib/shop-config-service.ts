import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { shopConfig as defaultConfig } from "@/config/shop.config";

const SHOP_CONFIG_DOC = "shopConfig";
const SHOP_SETTINGS_COLLECTION = "settings";

export interface ShopConfig {
  brand: {
    name: string;
    tagline: string;
    logo: {
      emoji: string;
      image: string | null;
      initials: string;
    };
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
    };
  };
  contact: {
    email: string;
    phone: string;
    mobile: string;
    address: string;
    businessHours: {
      weekdays: string;
      saturday: string;
      sunday: string;
    };
    socialMedia: {
      facebook: string | null;
      instagram: string | null;
      twitter: string | null;
      tiktok: string | null;
    };
  };
  header: {
    navLinks: Array<{
      label: string;
      href: string;
      showCartCount?: boolean;
    }>;
    showSearch: boolean;
    showCartIcon: boolean;
    stickyHeader: boolean;
  };
  homepage: {
    hero: {
      title: string;
      subtitle: string;
      ctaButton: string;
      ctaLink: string;
      showSecondaryButton: boolean;
      secondaryButton: string;
      secondaryLink: string;
      backgroundImage: string | null;
    };
    features: {
      title: string;
      items: Array<{
        icon: string;
        title: string;
        description: string;
      }>;
    };
    featuredProducts: {
      show: boolean;
      title: string;
      limit: number;
    };
    promoBanner: {
      show: boolean;
      title: string;
      description: string;
      buttonText: string;
      backgroundColor: string;
    };
  };
  products: {
    title: string;
    subtitle: string;
    showCategories: boolean;
    categories: string[];
    showSearch: boolean;
    itemsPerRow: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
    showStockCount: boolean;
    outOfStockMessage: string;
    lowStockThreshold: number;
    lowStockMessage: string;
    addToCartButton: string;
  };
  cart: {
    title: string;
    emptyMessage: string;
    emptyCta: string;
    promoCodes: {
      show: boolean;
      title: string;
      placeholder: string;
      buttonText: string;
      codes: Array<{
        code: string;
        discount: number;
        type: string;
        description: string;
      }>;
    };
    summary: {
      showSubtotal: boolean;
      showTax: boolean;
      taxRate: number;
      taxLabel: string;
      showDiscount: boolean;
      totalLabel: string;
    };
    checkout: {
      buttonText: string;
      formTitle: string;
      fields: {
        name: { label: string; required: boolean; placeholder: string };
        phone: { label: string; required: boolean; placeholder: string };
        email: { label: string; required: boolean; placeholder: string };
      };
      orderType: {
        show: boolean;
        label: string;
        options: Array<{
          value: string;
          label: string;
          description: string;
        }>;
      };
      deliveryAddress: {
        show: boolean;
        required: boolean;
        label: string;
        placeholder: string;
      };
      notes: {
        show: boolean;
        label: string;
        placeholder: string;
      };
      payment: {
        method: string;
        instructions: string;
      };
      submitButton: string;
      successMessage: string;
      paymentMethods: {
        show: boolean;
        label: string;
      };
    };
  };
  payment: {
    gcash: {
      enabled: boolean;
      qrCodeUrl: string | null;
      accountName: string;
      accountNumber: string;
      instructions: string;
    };
    paymaya: {
      enabled: boolean;
      qrCodeUrl: string | null;
      accountName: string;
      accountNumber: string;
      instructions: string;
    };
    cod: {
      enabled: boolean;
      label: string;
      description: string;
      fee: number;
    };
    cop: {
      enabled: boolean;
      label: string;
      description: string;
    };
    displayOrder: readonly string[];
  };
  orderSuccess: {
    title: string;
    icon: string;
    message: string;
    subMessage: string;
    nextSteps: {
      title: string;
      steps: string[];
    };
    buttons: {
      primary: { text: string; link: string };
      secondary: { text: string; link: string };
    };
  };
  about: {
    hero: {
      title: string;
      subtitle: string;
    };
    story: {
      title: string;
      content: string;
      highlights: Array<{
        year: string;
        event: string;
      }>;
    };
    mission: {
      title: string;
      content: string;
    };
    vision: {
      title: string;
      content: string;
    };
    values: {
      title: string;
      items: Array<{
        icon: string;
        title: string;
        description: string;
      }>;
    };
    team: {
      show: boolean;
      title: string;
      members: Array<{
        name: string;
        role: string;
        image: string | null;
      }>;
    };
    contact: {
      show: boolean;
      title: string;
      subtitle: string;
    };
  };
  footer: {
    columns: Array<{
      title: string;
      type: string;
      content?: string;
      links?: Array<{ label: string; href: string }>;
      showSocial?: boolean;
    }>;
    bottomBar: {
      show: boolean;
      copyright: string;
      extraLinks: Array<{ label: string; href: string }>;
    };
  };
  messages: {
    itemAdded: string;
    itemRemoved: string;
    cartCleared: string;
    stockLimit: string;
    outOfStock: string;
    promoApplied: string;
    promoInvalid: string;
    promoRemoved: string;
    orderSuccess: string;
    orderError: string;
    requiredField: string;
  };
  popupBanner: {
    show: boolean;
    title: string;
    message: string;
    buttonText: string;
    buttonLink: string;
    showOncePerSession: boolean;
    autoShowDelay: number;
    backgroundColor: string;
    textColor: string;
    position: string;
    canClose: boolean;
  };
  filters: {
    showFilters: boolean;
    filterTypes: Array<{
      id: string;
      label: string;
      show: boolean;
    }>;
    priceRanges: Array<{
      label: string;
      min: number;
      max: number | null;
    }>;
    sorting: {
      show: boolean;
      options: Array<{
        value: string;
        label: string;
      }>;
    };
  };
  chat: {
    enabled: boolean;
    widgetPosition: string;
    widgetColor: string;
    welcomeMessage: string;
    placeholderText: string;
    sendButtonText: string;
    autoReplyEnabled: boolean;
    autoReplyMessage: string;
    showAvatar: boolean;
    avatarEmoji: string;
    offlineMessage: string;
    businessHoursOnly: boolean;
    soundEnabled: boolean;
  };
  notifications: {
    showOrderConfirmations: boolean;
    showPromoNotifications: boolean;
    showStockAlerts: boolean;
    toastPosition: string;
    toastDuration: number;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

/**
 * Get shop configuration from Firestore
 * Returns default config if none exists in Firestore
 */
export async function getShopConfig(): Promise<ShopConfig> {
  try {
    const docRef = doc(db, SHOP_SETTINGS_COLLECTION, SHOP_CONFIG_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Merge with default config to ensure all fields exist
      return { ...defaultConfig, ...docSnap.data() } as ShopConfig;
    }

    // If no config exists, save default config to Firestore
    await saveShopConfig(defaultConfig as ShopConfig);
    return defaultConfig as ShopConfig;
  } catch (error) {
    console.error("Error getting shop config:", error);
    return defaultConfig as ShopConfig;
  }
}

/**
 * Save shop configuration to Firestore
 */
export async function saveShopConfig(config: ShopConfig): Promise<void> {
  try {
    const docRef = doc(db, SHOP_SETTINGS_COLLECTION, SHOP_CONFIG_DOC);
    await setDoc(docRef, config, { merge: true });
  } catch (error) {
    console.error("Error saving shop config:", error);
    throw error;
  }
}

/**
 * Update specific fields in shop configuration
 */
export async function updateShopConfig(updates: Partial<ShopConfig>): Promise<void> {
  try {
    const docRef = doc(db, SHOP_SETTINGS_COLLECTION, SHOP_CONFIG_DOC);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating shop config:", error);
    throw error;
  }
}

/**
 * Reset shop configuration to defaults
 */
export async function resetShopConfig(): Promise<ShopConfig> {
  try {
    await saveShopConfig(defaultConfig as ShopConfig);
    return defaultConfig as ShopConfig;
  } catch (error) {
    console.error("Error resetting shop config:", error);
    throw error;
  }
}
