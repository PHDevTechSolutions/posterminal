// Payment Integration Service for GCash, PayMaya, and Card payments
import { toast } from "sonner";

export interface PaymentDetails {
  amount: number;
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  referenceNumber?: string;
  error?: string;
  paymentUrl?: string;
}

class PaymentIntegration {
  // GCash Payment via PayMongo or similar API
  async processGCashPayment(details: PaymentDetails): Promise<PaymentResult> {
    try {
      // This would integrate with GCash API (PayMongo, Xendit, etc.)
      // For now, simulating the flow
      
      toast.info("Connecting to GCash...", {
        description: "Please check your GCash app to confirm payment"
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, this would:
      // 1. Create payment intent with PayMongo/Xendit
      // 2. Get payment URL/source
      // 3. Redirect user or show QR code
      // 4. Wait for webhook confirmation

      return {
        success: true,
        transactionId: `GC-${Date.now()}`,
        referenceNumber: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        paymentUrl: "https://pay.gcash.com/checkout/..." // Would be actual URL
      };
    } catch (error: any) {
      console.error("GCash payment error:", error);
      return {
        success: false,
        error: error.message || "GCash payment failed"
      };
    }
  }

  // PayMaya Payment
  async processPayMayaPayment(details: PaymentDetails): Promise<PaymentResult> {
    try {
      toast.info("Connecting to PayMaya...", {
        description: "Processing PayMaya payment"
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        transactionId: `PM-${Date.now()}`,
        referenceNumber: `PM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };
    } catch (error: any) {
      console.error("PayMaya payment error:", error);
      return {
        success: false,
        error: error.message || "PayMaya payment failed"
      };
    }
  }

  // Card Payment (Credit/Debit)
  async processCardPayment(
    details: PaymentDetails, 
    cardData: {
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
      cvc: string;
      cardHolder: string;
    }
  ): Promise<PaymentResult> {
    try {
      // Validate card
      if (!this.validateCardNumber(cardData.cardNumber)) {
        return { success: false, error: "Invalid card number" };
      }

      toast.info("Processing card payment...");
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production: Integrate with Stripe, PayMongo, or PayPal
      
      return {
        success: true,
        transactionId: `CARD-${Date.now()}`,
        referenceNumber: `CARD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };
    } catch (error: any) {
      console.error("Card payment error:", error);
      return {
        success: false,
        error: error.message || "Card payment failed"
      };
    }
  }

  // Generate GCash QR Code for payment
  async generateGCashQR(details: PaymentDetails): Promise<string> {
    // In production, this would generate an actual QR code
    // For now, return a placeholder
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GCASH:${details.amount}:${details.orderId}`;
  }

  // Validate card number using Luhn algorithm
  private validateCardNumber(cardNumber: string): boolean {
    const clean = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(clean)) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  // Check payment status
  async checkPaymentStatus(transactionId: string): Promise<PaymentResult> {
    try {
      // In production: Query payment provider API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        transactionId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cash payment (immediate success)
  processCashPayment(details: PaymentDetails): PaymentResult {
    return {
      success: true,
      transactionId: `CASH-${Date.now()}`,
      referenceNumber: `C-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    };
  }
}

export const paymentIntegration = new PaymentIntegration();
