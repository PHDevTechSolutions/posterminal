// Discount & Promo System - BOGO, Happy Hour, Member Discounts
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, Timestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";

export interface Promo {
  id?: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'bundle' | 'happy_hour';
  value: number; // Percentage (0-100) or fixed amount
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  conditions: {
    minPurchase?: number;
    maxDiscount?: number;
    applicableItems?: string[]; // Item IDs
    applicableCategories?: string[];
    excludeItems?: string[];
    memberOnly?: boolean;
    happyHours?: { start: string; end: string; days: number[] }; // 0=Sun, 6=Sat
  };
  usageLimit?: number;
  usageCount: number;
  createdAt?: Timestamp;
}

export interface AppliedDiscount {
  promoId: string;
  promoName: string;
  type: string;
  amount: number;
  originalPrice: number;
  finalPrice: number;
}

class DiscountPromoService {
  private activePromos: Promo[] = [];

  async loadActivePromos() {
    const now = Timestamp.now();
    const q = query(
      collection(db, "promos"),
      where("isActive", "==", true),
      where("startDate", "<=", now),
      where("endDate", ">=", now)
    );
    
    const snapshot = await getDocs(q);
    this.activePromos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Promo));
  }

  // Calculate applicable discounts for cart items
  calculateDiscounts(
    items: Array<{ id: string; name: string; price: number; category: string; quantity: number }>,
    subtotal: number,
    customerPoints?: number,
    isMember: boolean = false
  ): { appliedDiscounts: AppliedDiscount[]; totalDiscount: number; finalSubtotal: number } {
    const appliedDiscounts: AppliedDiscount[] = [];
    let totalDiscount = 0;

    // Check each promo
    this.activePromos.forEach(promo => {
      // Check time-based restrictions (Happy Hour)
      if (promo.type === 'happy_hour' && promo.conditions.happyHours) {
        if (!this.isInHappyHour(promo.conditions.happyHours)) {
          return;
        }
      }

      // Check member restriction
      if (promo.conditions.memberOnly && !isMember) {
        return;
      }

      // Check minimum purchase
      if (promo.conditions.minPurchase && subtotal < promo.conditions.minPurchase) {
        return;
      }

      // Calculate discount based on promo type
      let discount = 0;

      switch (promo.type) {
        case 'percentage':
          discount = subtotal * (promo.value / 100);
          break;

        case 'fixed':
          discount = promo.value;
          break;

        case 'bogo':
          // Buy One Get One - find applicable items
          discount = this.calculateBOGODiscount(items, promo);
          break;

        case 'bundle':
          // Bundle deal (e.g., 3 for price of 2)
          discount = this.calculateBundleDiscount(items, promo);
          break;

        case 'happy_hour':
          discount = subtotal * (promo.value / 100);
          break;
      }

      // Apply max discount limit
      if (promo.conditions.maxDiscount && discount > promo.conditions.maxDiscount) {
        discount = promo.conditions.maxDiscount;
      }

      if (discount > 0) {
        appliedDiscounts.push({
          promoId: promo.id!,
          promoName: promo.name,
          type: promo.type,
          amount: discount,
          originalPrice: subtotal,
          finalPrice: subtotal - discount
        });
        totalDiscount += discount;
      }
    });

    // Member points discount (convert points to discount)
    if (customerPoints && customerPoints > 0) {
      const pointsDiscount = Math.min(customerPoints * 0.1, subtotal * 0.2); // Max 20% off with points
      if (pointsDiscount > 0) {
        appliedDiscounts.push({
          promoId: 'loyalty_points',
          promoName: 'Loyalty Points Redemption',
          type: 'points',
          amount: pointsDiscount,
          originalPrice: subtotal - totalDiscount,
          finalPrice: subtotal - totalDiscount - pointsDiscount
        });
        totalDiscount += pointsDiscount;
      }
    }

    return {
      appliedDiscounts,
      totalDiscount,
      finalSubtotal: subtotal - totalDiscount
    };
  }

  private isInHappyHour(happyHour: { start: string; end: string; days: number[] }): boolean {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (!happyHour.days.includes(currentDay)) {
      return false;
    }

    const [startH, startM] = happyHour.start.split(':').map(Number);
    const [endH, endM] = happyHour.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentTime >= startMinutes && currentTime <= endMinutes;
  }

  private calculateBOGODiscount(items: any[], promo: Promo): number {
    let discount = 0;
    
    items.forEach(item => {
      const isApplicable = promo.conditions.applicableItems?.includes(item.id) ||
                          promo.conditions.applicableCategories?.includes(item.category);
      
      if (isApplicable) {
        const pairs = Math.floor(item.quantity / 2);
        discount += pairs * item.price;
      }
    });

    return discount;
  }

  private calculateBundleDiscount(items: any[], promo: Promo): number {
    // Example: "3 for price of 2" bundle
    let discount = 0;
    const bundleSize = 3;
    const payFor = 2;

    items.forEach(item => {
      const isApplicable = promo.conditions.applicableItems?.includes(item.id) ||
                          promo.conditions.applicableCategories?.includes(item.category);
      
      if (isApplicable) {
        const bundles = Math.floor(item.quantity / bundleSize);
        discount += bundles * item.price * (bundleSize - payFor);
      }
    });

    return discount;
  }

  // Admin functions
  async createPromo(promo: Omit<Promo, 'id' | 'createdAt' | 'usageCount'>): Promise<string> {
    const docRef = await addDoc(collection(db, "promos"), {
      ...promo,
      usageCount: 0,
      createdAt: Timestamp.now()
    });
    
    toast.success(`Promo "${promo.name}" created successfully`);
    return docRef.id;
  }

  async updatePromo(promoId: string, updates: Partial<Promo>) {
    await updateDoc(doc(db, "promos", promoId), updates);
    toast.success("Promo updated successfully");
  }

  async deletePromo(promoId: string) {
    await deleteDoc(doc(db, "promos", promoId));
    toast.success("Promo deleted successfully");
  }

  async getAllPromos(): Promise<Promo[]> {
    const snapshot = await getDocs(collection(db, "promos"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promo));
  }

  // Quick promo presets
  getHappyHourPreset(): Partial<Promo> {
    return {
      name: 'Happy Hour Special',
      description: '20% off all drinks during happy hour',
      type: 'happy_hour',
      value: 20,
      conditions: {
        happyHours: {
          start: '15:00',
          end: '18:00',
          days: [1, 2, 3, 4, 5] // Monday to Friday
        },
        applicableCategories: ['Drinks']
      }
    };
  }

  getBOGOPreset(): Partial<Promo> {
    return {
      name: 'Buy One Get One',
      description: 'Buy one, get one free on selected items',
      type: 'bogo',
      value: 100,
      conditions: {}
    };
  }

  getMemberDiscountPreset(): Partial<Promo> {
    return {
      name: 'Member Special',
      description: '10% off for loyal members',
      type: 'percentage',
      value: 10,
      conditions: {
        memberOnly: true
      }
    };
  }
}

export const discountPromoService = new DiscountPromoService();
