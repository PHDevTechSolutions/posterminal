"use client";

import { useState } from "react";
import Link from "next/link";
import { useShop } from "@/context/ShopContext";
import { useShopConfig } from "@/context/ShopConfigContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, Tag, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createOrder } from "@/lib/firestore-service";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const { config, loading: configLoading } = useShopConfig();
  const {
    cart,
    cartTotal,
    cartCount,
    updateQuantity,
    removeFromCart,
    clearCart,
    appliedPromo,
    applyPromo,
    removePromo,
    discountedTotal,
  } = useShop();

  const [promoCode, setPromoCode] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    orderType: "pickup" as "pickup" | "delivery",
  });

  if (configLoading || !config) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { brand, cart: cartConfig, messages, contact, payment } = config;

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      applyPromo(promoCode.trim());
      setPromoCode("");
    }
  };

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error(config.messages.requiredField);
      return;
    }

    try {
      setIsCheckingOut(true);

      const subtotal = cartTotal;
      const tax = subtotal * 0.12;
      const discount = appliedPromo
        ? appliedPromo.type === "percentage"
          ? subtotal * (appliedPromo.discount / 100)
          : appliedPromo.discount
        : 0;
      const total = discountedTotal + tax;

      await createOrder({
        items: cart.map((item) => ({
          ...item,
        })),
        subtotal,
        tax,
        discount,
        discountType: appliedPromo ? "promo" : "none",
        promoCode: appliedPromo?.code || null,
        total,
        totalCost: cart.reduce((acc, item) => acc + (item.cost || 0) * item.quantity, 0),
        profit: total - cart.reduce((acc, item) => acc + (item.cost || 0) * item.quantity, 0),
        paymentMethod: selectedPayment || "Cash",
        paymentProof: paymentProof,
        orderType: customerInfo.orderType === "delivery" ? "Delivery" : "Take-out",
        status: "pending",
        cashierName: "Online Order",
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email || null,
        customerAddress: customerInfo.address || null,
        source: "online",
      } as any);

      toast.success(config.messages.orderSuccess);
      clearCart();
      router.push("/shop/order-success");
    } catch (error: any) {
      toast.error(error.message || config.messages.orderError);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-semibold mb-2">{cartConfig.emptyMessage}</h1>
          <p className="text-gray-500 mb-6">{cartConfig.emptyCta}</p>
          <Link href="/shop/products">
            <Button style={{ backgroundColor: brand.colors.primary }} className="hover:opacity-90">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {cartConfig.emptyCta}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-6">{cartConfig.title} ({cartCount} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">₱{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="font-semibold">₱{item.price * item.quantity}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Link href="/shop/products">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm bg-gray-50 sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">{cartConfig.summary.totalLabel}</h2>

              {/* Promo Code */}
              {cartConfig.promoCodes.show && (
                <div className="mb-4">
                  <Label className="text-xs text-gray-500">{cartConfig.promoCodes.title}</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder={cartConfig.promoCodes.placeholder}
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="uppercase"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim()}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                {appliedPromo && (
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-green-600">
                      {appliedPromo.code} ({appliedPromo.discount}
                      {appliedPromo.type === "percentage" ? "%" : "₱"} off)
                    </span>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-red-500" onClick={removePromo}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>
              )}

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₱{cartTotal.toFixed(2)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>
                      -₱
                      {(cartTotal - discountedTotal).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax (12%)</span>
                  <span>₱{(discountedTotal * 0.12).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₱{(discountedTotal * 1.12).toFixed(2)}</span>
                </div>
              </div>

              {!showCheckout ? (
                <Button
                  className="w-full mt-6 h-12 hover:opacity-90"
                  style={{ backgroundColor: brand.colors.primary }}
                  onClick={() => setShowCheckout(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {cartConfig.checkout.buttonText}
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {/* Checkout Form */}
          {showCheckout && (
            <Card className="border-0 shadow-sm bg-gray-50 mt-4">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">{cartConfig.checkout.formTitle}</h2>

                <div className="space-y-4">
                  <div>
                    <Label>
                      {cartConfig.checkout.fields.name.label} {cartConfig.checkout.fields.name.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder={cartConfig.checkout.fields.name.placeholder}
                    />
                  </div>

                  <div>
                    <Label>
                      {cartConfig.checkout.fields.phone.label} {cartConfig.checkout.fields.phone.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder={cartConfig.checkout.fields.phone.placeholder}
                    />
                  </div>

                  <div>
                    <Label>{cartConfig.checkout.fields.email.label}</Label>
                    <Input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder={cartConfig.checkout.fields.email.placeholder}
                    />
                  </div>

                  <div>
                    <Label>Order Type</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="orderType"
                          value="pickup"
                          checked={customerInfo.orderType === "pickup"}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, orderType: e.target.value as "pickup" })
                          }
                        />
                        <span>Pickup</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="orderType"
                          value="delivery"
                          checked={customerInfo.orderType === "delivery"}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, orderType: e.target.value as "delivery" })
                          }
                        />
                        <span>Delivery</span>
                      </label>
                    </div>
                  </div>

                  {customerInfo.orderType === "delivery" && (
                    <div>
                      <Label>Delivery Address</Label>
                      <Input
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        placeholder="Full address"
                      />
                    </div>
                  )}

                  {/* Payment Method Selection */}
                  {cartConfig.checkout.paymentMethods?.show && (
                    <div>
                      <Label>{cartConfig.checkout.paymentMethods?.label || "Payment Method"}</Label>
                      <div className="space-y-3 mt-2">
                        {/* GCash */}
                        {payment.gcash.enabled && (
                          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="payment"
                              value="GCash"
                              checked={selectedPayment === "GCash"}
                              onChange={(e) => setSelectedPayment(e.target.value)}
                            />
                            <div className="flex-1">
                              <span className="font-medium">GCash</span>
                              {payment.gcash.qrCodeUrl && selectedPayment === "GCash" && (
                                <div className="mt-3 p-4 bg-white border rounded-lg">
                                  <p className="text-sm text-gray-600 mb-2">{payment.gcash.instructions}</p>
                                  <p className="text-sm font-medium">Account: {payment.gcash.accountName}</p>
                                  <p className="text-sm text-gray-500">{payment.gcash.accountNumber}</p>
                                  <img 
                                    src={payment.gcash.qrCodeUrl} 
                                    alt="GCash QR Code" 
                                    className="mt-2 w-48 h-48 object-contain mx-auto"
                                  />
                                </div>
                              )}
                            </div>
                          </label>
                        )}

                        {/* PayMaya */}
                        {payment.paymaya.enabled && (
                          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="payment"
                              value="PayMaya"
                              checked={selectedPayment === "PayMaya"}
                              onChange={(e) => setSelectedPayment(e.target.value)}
                            />
                            <div className="flex-1">
                              <span className="font-medium">PayMaya</span>
                              {payment.paymaya.qrCodeUrl && selectedPayment === "PayMaya" && (
                                <div className="mt-3 p-4 bg-white border rounded-lg">
                                  <p className="text-sm text-gray-600 mb-2">{payment.paymaya.instructions}</p>
                                  <p className="text-sm font-medium">Account: {payment.paymaya.accountName}</p>
                                  <p className="text-sm text-gray-500">{payment.paymaya.accountNumber}</p>
                                  <img 
                                    src={payment.paymaya.qrCodeUrl} 
                                    alt="PayMaya QR Code" 
                                    className="mt-2 w-48 h-48 object-contain mx-auto"
                                  />
                                </div>
                              )}
                            </div>
                          </label>
                        )}

                        {/* Cash on Delivery */}
                        {payment.cod.enabled && customerInfo.orderType === "delivery" && (
                          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="payment"
                              value="Cash on Delivery"
                              checked={selectedPayment === "Cash on Delivery"}
                              onChange={(e) => setSelectedPayment(e.target.value)}
                            />
                            <div>
                              <span className="font-medium">{payment.cod.label}</span>
                              <p className="text-sm text-gray-500">{payment.cod.description}</p>
                              {payment.cod.fee > 0 && (
                                <p className="text-sm text-orange-600">+₱{payment.cod.fee} fee</p>
                              )}
                            </div>
                          </label>
                        )}

                        {/* Cash on Pickup */}
                        {payment.cop.enabled && customerInfo.orderType === "pickup" && (
                          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="payment"
                              value="Cash on Pickup"
                              checked={selectedPayment === "Cash on Pickup"}
                              onChange={(e) => setSelectedPayment(e.target.value)}
                            />
                            <div>
                              <span className="font-medium">{payment.cop.label}</span>
                              <p className="text-sm text-gray-500">{payment.cop.description}</p>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 hover:opacity-90"
                    style={{ backgroundColor: brand.colors.primary }}
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        {cartConfig.checkout.submitButton} (₱{(discountedTotal * 1.12).toFixed(2)})
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowCheckout(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
