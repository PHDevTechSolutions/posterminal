"use client";

import { useState } from "react";
import { 
  X, 
  QrCode, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Loader2,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { paymentIntegration } from "@/lib/payment-integration";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId: string;
  onPaymentSuccess: (paymentMethod: string, reference: string) => void;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  orderId,
  onPaymentSuccess 
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'paymaya' | 'card'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    cardHolder: ''
  });

  if (!isOpen) return null;

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      let result;

      switch (paymentMethod) {
        case 'cash':
          result = paymentIntegration.processCashPayment({
            amount,
            orderId
          });
          break;

        case 'gcash':
          if (!showQR) {
            // Generate QR code first
            const qr = await paymentIntegration.generateGCashQR({
              amount,
              orderId
            });
            setQrUrl(qr);
            setShowQR(true);
            setIsProcessing(false);
            return;
          } else {
            // Process payment
            result = await paymentIntegration.processGCashPayment({
              amount,
              orderId
            });
          }
          break;

        case 'paymaya':
          result = await paymentIntegration.processPayMayaPayment({
            amount,
            orderId
          });
          break;

        case 'card':
          if (!cardData.cardNumber || !cardData.expiryMonth || !cardData.expiryYear || !cardData.cvc) {
            toast.error("Please fill in all card details");
            setIsProcessing(false);
            return;
          }
          result = await paymentIntegration.processCardPayment(
            { amount, orderId },
            cardData
          );
          break;

        default:
          toast.error("Invalid payment method");
          return;
      }

      if (result.success) {
        toast.success("Payment successful!", {
          description: `Ref: ${result.referenceNumber}`
        });
        onPaymentSuccess(paymentMethod, result.referenceNumber || '');
        onClose();
      } else {
        toast.error(result.error || "Payment failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Payment error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Payment</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-gray-500 mt-1">Order #{orderId.slice(-8).toUpperCase()}</p>
        </div>

        <div className="p-6">
          {/* Amount Display */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-4xl font-black text-indigo-600">₱{amount.toFixed(2)}</p>
          </div>

          {/* Payment Methods */}
          {!showQR && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  <Banknote className={`h-6 w-6 ${paymentMethod === 'cash' ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${paymentMethod === 'cash' ? 'text-indigo-600' : 'text-gray-600'}`}>
                    Cash
                  </span>
                </button>

                <button
                  onClick={() => setPaymentMethod('gcash')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'gcash' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <Smartphone className={`h-6 w-6 ${paymentMethod === 'gcash' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${paymentMethod === 'gcash' ? 'text-blue-600' : 'text-gray-600'}`}>
                    GCash
                  </span>
                </button>

                <button
                  onClick={() => setPaymentMethod('paymaya')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'paymaya' 
                      ? 'border-green-600 bg-green-50' 
                      : 'border-gray-200 hover:border-green-200'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 ${paymentMethod === 'paymaya' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${paymentMethod === 'paymaya' ? 'text-green-600' : 'text-gray-600'}`}>
                    PayMaya
                  </span>
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 ${paymentMethod === 'card' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${paymentMethod === 'card' ? 'text-purple-600' : 'text-gray-600'}`}>
                    Card
                  </span>
                </button>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <Label>Card Number</Label>
                    <Input
                      placeholder="0000 0000 0000 0000"
                      value={cardData.cardNumber}
                      onChange={(e) => setCardData({...cardData, cardNumber: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Expiry Date</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="MM"
                          maxLength={2}
                          value={cardData.expiryMonth}
                          onChange={(e) => setCardData({...cardData, expiryMonth: e.target.value})}
                        />
                        <Input
                          placeholder="YY"
                          maxLength={2}
                          value={cardData.expiryYear}
                          onChange={(e) => setCardData({...cardData, expiryYear: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>CVC</Label>
                      <Input
                        placeholder="123"
                        maxLength={3}
                        value={cardData.cvc}
                        onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Card Holder</Label>
                    <Input
                      placeholder="Name on card"
                      value={cardData.cardHolder}
                      onChange={(e) => setCardData({...cardData, cardHolder: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* QR Code Display for GCash */}
          {showQR && (
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-4">Scan this QR code with GCash app</p>
              <div className="bg-white p-4 rounded-xl border inline-block">
                <img src={qrUrl} alt="GCash QR" className="w-48 h-48" />
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Or click Complete Payment after paying in app
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowQR(false)}
              >
                Back to Payment Methods
              </Button>
            </div>
          )}

          {/* Action Button */}
          <Button
            className="w-full h-14 text-lg font-bold"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : showQR ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Complete Payment
              </>
            ) : (
              `Pay ₱${amount.toFixed(2)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
