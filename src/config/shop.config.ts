// SHOP CONFIGURATION - Modify this file to customize your online shop
// All content, colors, text, and settings can be changed here

export const shopConfig = {
  // ==========================================
  // BRAND & LOGO
  // ==========================================
  brand: {
    name: "Your Shop Name",
    tagline: "Your tagline here",
    logo: {
      // Option 1: Use an emoji
      emoji: "🏪",
      // Option 2: Use an image (place in public folder and reference like "/logo.png")
      image: null, // "/logo.png" or null to use emoji
      // Option 3: Use text initials
      initials: "YS",
    },
    colors: {
      primary: "#000000",   // Main buttons, header
      secondary: "#6B7280", // Text, icons
      accent: "#10B981",    // Success, checkmarks
      background: "#FFFFFF", // Page background
      surface: "#F9FAFB",   // Cards, sections
    },
  },

  // ==========================================
  // CONTACT INFORMATION
  // ==========================================
  contact: {
    email: "support@yourshop.com",
    phone: "(123) 456-7890",
    mobile: "+63 912 345 6789", // For WhatsApp/SMS
    address: "123 Main Street, City, Country",
    businessHours: {
      weekdays: "9:00 AM - 8:00 PM",
      saturday: "9:00 AM - 6:00 PM",
      sunday: "10:00 AM - 5:00 PM",
    },
    socialMedia: {
      facebook: "https://facebook.com/yourshop",
      instagram: "https://instagram.com/yourshop",
      twitter: null, // or "https://twitter.com/yourshop"
      tiktok: null,
    },
  },

  // ==========================================
  // HEADER / NAVIGATION
  // ==========================================
  header: {
    // Navigation links shown in header
    navLinks: [
      { label: "Home", href: "/shop" },
      { label: "Products", href: "/shop/products" },
      { label: "About Us", href: "/shop/about" },
      { label: "Cart", href: "/shop/cart", showCartCount: true },
    ],
    // Show/hide elements
    showSearch: true,
    showCartIcon: true,
    stickyHeader: true,
  },

  // ==========================================
  // HOMEPAGE (SHOP INDEX)
  // ==========================================
  homepage: {
    hero: {
      title: "Welcome to {shopName}",
      subtitle: "Shop your favorite products online. Order for pickup or delivery.",
      ctaButton: "Shop Now",
      ctaLink: "/shop/products",
      showSecondaryButton: true,
      secondaryButton: "View Cart",
      secondaryLink: "/shop/cart",
      // Background: null for solid color, or image URL
      backgroundImage: null, // or "/hero-bg.jpg"
    },
    
    features: {
      title: "Why Choose Us",
      items: [
        {
          icon: "Package",
          title: "Quality Products",
          description: "Carefully selected items for your everyday needs",
        },
        {
          icon: "Truck",
          title: "Fast Pickup",
          description: "Order online and pick up in-store within minutes",
        },
        {
          icon: "Shield",
          title: "Secure Payment",
          description: "Safe checkout with multiple payment options",
        },
      ],
    },

    featuredProducts: {
      show: true,
      title: "Featured Products",
      limit: 4, // Number of products to show
    },

    promoBanner: {
      show: true,
      title: "Special Offers",
      description: "Check out our latest deals and discounts",
      buttonText: "View Promos",
      backgroundColor: "#1F2937",
    },
  },

  // ==========================================
  // PRODUCTS PAGE
  // ==========================================
  products: {
    title: "Our Products",
    subtitle: "Browse our collection of quality items",
    showCategories: true,
    categories: ["All", "Grains", "Grocery", "Drinks", "Household"],
    showSearch: true,
    itemsPerRow: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
    },
    showStockCount: true,
    outOfStockMessage: "Out of Stock",
    lowStockThreshold: 10,
    lowStockMessage: "Only {count} left",
    addToCartButton: "Add to Cart",
  },

  // ==========================================
  // CART & CHECKOUT
  // ==========================================
  cart: {
    title: "Shopping Cart",
    emptyMessage: "Your cart is empty",
    emptyCta: "Continue Shopping",
    
    promoCodes: {
      show: true,
      title: "Promo Code",
      placeholder: "Enter code",
      buttonText: "Apply",
      // Available promo codes
      codes: [
        { code: "SAVE10", discount: 10, type: "percentage", description: "10% off" },
        { code: "SAVE20", discount: 20, type: "percentage", description: "20% off" },
        { code: "WELCOME50", discount: 50, type: "fixed", description: "₱50 off" },
      ],
    },

    summary: {
      showSubtotal: true,
      showTax: true,
      taxRate: 0.12,
      taxLabel: "Tax (12%)",
      showDiscount: true,
      totalLabel: "Total",
    },

    checkout: {
      buttonText: "Proceed to Checkout",
      formTitle: "Customer Information",
      
      fields: {
        name: { label: "Full Name", required: true, placeholder: "Juan Dela Cruz" },
        phone: { label: "Phone Number", required: true, placeholder: "09123456789" },
        email: { label: "Email", required: false, placeholder: "juan@example.com" },
      },

      orderType: {
        show: true,
        label: "Order Type",
        options: [
          { value: "pickup", label: "Store Pickup", description: "Pick up at our store" },
          { value: "delivery", label: "Delivery", description: "We deliver to your address" },
        ],
      },

      deliveryAddress: {
        show: true,
        required: true,
        label: "Delivery Address",
        placeholder: "Complete address with landmarks",
      },

      notes: {
        show: true,
        label: "Order Notes",
        placeholder: "Special instructions (optional)",
      },

      payment: {
        method: "Cash on Pickup/Delivery", // Cash, GCash, etc.
        instructions: "Pay when you pickup or upon delivery",
      },

      // Payment method selection
      paymentMethods: {
        show: true,
        label: "Payment Method",
      },

      submitButton: "Place Order",
      successMessage: "Order placed successfully!",
    },
  },

  // ==========================================
  // PAYMENT METHODS
  // ==========================================
  payment: {
    // QR Code Images (upload your own QR codes)
    gcash: {
      enabled: true,
      qrCodeUrl: null as string | null, // URL to GCash QR code image
      accountName: "Your Store Name",
      accountNumber: "09XXXXXXXXX",
      instructions: "Scan the QR code with your GCash app to pay",
    },
    paymaya: {
      enabled: true,
      qrCodeUrl: null as string | null, // URL to PayMaya QR code image
      accountName: "Your Store Name", 
      accountNumber: "09XXXXXXXXX",
      instructions: "Scan the QR code with your PayMaya app to pay",
    },
    // Cash on Delivery
    cod: {
      enabled: true,
      label: "Cash on Delivery",
      description: "Pay when you receive your order",
      fee: 0, // Additional fee for COD (0 for free)
    },
    // Cash on Pickup
    cop: {
      enabled: true,
      label: "Cash on Pickup",
      description: "Pay when you pickup your order",
    },
    // Show payment options in this order
    displayOrder: ["gcash", "paymaya", "cod", "cop"] as const,
  },

  // ==========================================
  // ORDER SUCCESS PAGE
  // ==========================================
  orderSuccess: {
    title: "Order Placed!",
    icon: "CheckCircle",
    message: "Thank you for your order. We've received it and will process it shortly.",
    subMessage: "You'll receive a confirmation call soon.",
    
    nextSteps: {
      title: "What happens next?",
      steps: [
        "We'll confirm your order via phone",
        "Prepare your items for pickup/delivery",
        "Notify you when ready",
      ],
    },

    buttons: {
      primary: { text: "Continue Shopping", link: "/shop/products" },
      secondary: { text: "Back to Home", link: "/shop" },
    },
  },

  // ==========================================
  // ABOUT US PAGE
  // ==========================================
  about: {
    hero: {
      title: "About {shopName}",
      subtitle: "Learn more about who we are and what we do",
    },

    story: {
      title: "Our Story",
      content: `Founded with a passion for quality and service, {shopName} started as a small local business 
      with a big dream. Today, we serve thousands of customers with the same dedication 
      and commitment to excellence that we had from day one.`,
      
      highlights: [
        { year: "2020", event: "Business Started" },
        { year: "2021", event: "Online Store Launched" },
        { year: "2022", event: "1000+ Happy Customers" },
        { year: "2023", event: "Expanded Product Range" },
      ],
    },

    mission: {
      title: "Our Mission",
      content: "To provide quality products at fair prices while delivering exceptional customer service that makes every shopping experience a delight.",
    },

    vision: {
      title: "Our Vision",
      content: "To become the most trusted local shop, known for quality, convenience, and community connection.",
    },

    values: {
      title: "Our Values",
      items: [
        {
          icon: "⭐",
          title: "Quality First",
          description: "We never compromise on product quality",
        },
        {
          icon: "🤝",
          title: "Customer Focus",
          description: "Your satisfaction is our priority",
        },
        {
          icon: "💚",
          title: "Community",
          description: "Supporting local families and businesses",
        },
        {
          icon: "🔒",
          title: "Integrity",
          description: "Honest pricing and transparent service",
        },
      ],
    },

    team: {
      show: true,
      title: "Meet the Team",
      members: [
        {
          name: "Owner Name",
          role: "Founder & Owner",
          image: null, // "/team/owner.jpg" or null
        },
      ],
    },

    contact: {
      show: true,
      title: "Get in Touch",
      subtitle: "Have questions? We'd love to hear from you.",
    },
  },

  // ==========================================
  // FOOTER
  // ==========================================
  footer: {
    columns: [
      {
        title: "About Us",
        type: "text",
        content: "Your trusted local shop for quality products. Serving the community since 2020.",
      },
      {
        title: "Quick Links",
        type: "links",
        links: [
          { label: "Home", href: "/shop" },
          { label: "Products", href: "/shop/products" },
          { label: "About", href: "/shop/about" },
          { label: "Cart", href: "/shop/cart" },
        ],
      },
      {
        title: "Customer Service",
        type: "links",
        links: [
          { label: "Contact Us", href: "#contact" },
          { label: "FAQs", href: "#faqs" },
          { label: "Shipping Info", href: "#shipping" },
          { label: "Returns", href: "#returns" },
        ],
      },
      {
        title: "Contact",
        type: "contact",
        showSocial: true,
      },
    ],
    
    bottomBar: {
      show: true,
      copyright: "© {year} {shopName}. All rights reserved.",
      extraLinks: [
        { label: "Privacy Policy", href: "#privacy" },
        { label: "Terms of Service", href: "#terms" },
      ],
    },
  },

  // ==========================================
  // MESSAGES & TEXT
  // ==========================================
  messages: {
    // Cart messages
    itemAdded: "{itemName} added to cart",
    itemRemoved: "Item removed from cart",
    cartCleared: "Cart cleared",
    stockLimit: "Only {count} items available",
    outOfStock: "Sorry, this item is out of stock",
    
    // Promo messages
    promoApplied: "Promo {code} applied!",
    promoInvalid: "Invalid promo code",
    promoRemoved: "Promo removed",
    
    // Checkout messages
    orderSuccess: "Order placed successfully!",
    orderError: "Failed to place order. Please try again.",
    requiredField: "Please fill in all required fields",
  },

  // ==========================================
  // POPUP BANNER (Announcement Modal)
  // ==========================================
  popupBanner: {
    show: true,
    title: "Special Announcement",
    message: "Welcome to our new online store! Enjoy exclusive discounts for a limited time.",
    buttonText: "Shop Now",
    buttonLink: "/shop/products",
    showOncePerSession: true, // true = show once, false = show every visit
    autoShowDelay: 2000, // milliseconds before showing (0 = immediate)
    backgroundColor: "#1F2937",
    textColor: "#FFFFFF",
    position: "center", // center, bottom-right, bottom-left
    canClose: true,
  },

  // ==========================================
  // PRODUCT FILTERS & SORTING
  // ==========================================
  filters: {
    showFilters: true,
    filterTypes: [
      { id: "category", label: "Category", show: true },
      { id: "price", label: "Price Range", show: true },
      { id: "availability", label: "Availability", show: true },
    ],
    priceRanges: [
      { label: "Under ₱50", min: 0, max: 50 },
      { label: "₱50 - ₱100", min: 50, max: 100 },
      { label: "₱100 - ₱200", min: 100, max: 200 },
      { label: "Over ₱200", min: 200, max: null },
    ],
    sorting: {
      show: true,
      options: [
        { value: "featured", label: "Featured" },
        { value: "price-low", label: "Price: Low to High" },
        { value: "price-high", label: "Price: High to Low" },
        { value: "name-az", label: "Name: A-Z" },
        { value: "name-za", label: "Name: Z-A" },
        { value: "stock", label: "Availability" },
      ],
    },
  },

  // ==========================================
  // LIVE CHAT / MESSAGING
  // ==========================================
  chat: {
    enabled: true,
    widgetPosition: "bottom-right", // bottom-right, bottom-left
    widgetColor: "#000000",
    welcomeMessage: "Hi! How can we help you today?",
    placeholderText: "Type your message...",
    sendButtonText: "Send",
    autoReplyEnabled: true,
    autoReplyMessage: "Thanks for your message! Our team will respond shortly.",
    showAvatar: true,
    avatarEmoji: "👋",
    offlineMessage: "We're currently offline. Leave a message and we'll get back to you soon!",
    businessHoursOnly: false, // true = only show during business hours
    soundEnabled: true,
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  notifications: {
    showOrderConfirmations: true,
    showPromoNotifications: true,
    showStockAlerts: true,
    toastPosition: "bottom-right", // top-right, top-left, bottom-right, bottom-left
    toastDuration: 5000, // milliseconds
  },

  // ==========================================
  // SEO / META
  // ==========================================
  seo: {
    title: "{shopName} - Order Online",
    description: "Shop quality products online. Order for pickup or delivery.",
    keywords: "shop, store, online shopping, delivery, pickup",
  },
};

// Helper function to replace placeholders in text
export function formatShopText(text: string, shopName: string, extraVars?: Record<string, string>): string {
  let result = text.replace(/\{shopName\}/g, shopName);
  result = result.replace(/\{year\}/g, new Date().getFullYear().toString());
  
  if (extraVars) {
    Object.entries(extraVars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
  }
  
  return result;
}
