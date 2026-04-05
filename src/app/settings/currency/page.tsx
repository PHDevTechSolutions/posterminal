"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Globe, RefreshCw, TrendingUp, DollarSign, Euro, PoundSterling, JapaneseYen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { currencyService, SUPPORTED_CURRENCIES } from "@/lib/currency-service";

export default function CurrencySettingsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [currentCurrency, setCurrentCurrency] = useState(currencyService.getCurrentCurrency());
  const [sampleAmount] = useState(1000); // PHP 1000 sample

  useEffect(() => {
    const unsubscribe = currencyService.onCurrencyChange((currency) => {
      setCurrentCurrency(currency);
    });
    return unsubscribe;
  }, []);

  const handleCurrencyChange = (currencyCode: string) => {
    currencyService.setCurrency(currencyCode);
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    toast.success(`Currency changed to ${currency?.name}`);
  };

  const getFlag = (flag: string) => flag;

  const getIcon = (code: string) => {
    switch (code) {
      case 'USD': return <DollarSign className="h-5 w-5" />;
      case 'EUR': return <Euro className="h-5 w-5" />;
      case 'GBP': return <PoundSterling className="h-5 w-5" />;
      case 'JPY': return <JapaneseYen className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Globe className="h-8 w-8 text-indigo-600" />
                Currency Settings
              </h1>
              <p className="text-gray-500">Manage multi-currency support</p>
            </div>
          </div>
        </div>

        {/* Current Currency Card */}
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{getFlag(currentCurrency.flag)}</span>
                <div>
                  <p className="text-sm text-gray-500">Current Currency</p>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentCurrency.name} ({currentCurrency.code})
                  </h2>
                  <p className="text-lg text-indigo-600 font-semibold">
                    {currentCurrency.symbol}1 = ₱{(1 / currentCurrency.exchangeRate).toFixed(2)} PHP
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Sample Conversion</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{sampleAmount.toLocaleString()}
                </p>
                <p className="text-lg text-indigo-600 font-semibold">
                  = {currentCurrency.symbol}{currencyService.convert(sampleAmount).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SUPPORTED_CURRENCIES.map((currency) => (
            <Card
              key={currency.code}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                currentCurrency.code === currency.code
                  ? "ring-2 ring-indigo-500 border-indigo-500"
                  : ""
              }`}
              onClick={() => handleCurrencyChange(currency.code)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getFlag(currency.flag)}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        {currency.code}
                        {currentCurrency.code === currency.code && (
                          <Badge className="bg-indigo-100 text-indigo-700">Active</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{currency.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{currency.symbol}</p>
                    <p className="text-xs text-gray-500">
                      Rate: {currency.exchangeRate}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                  ₱{sampleAmount.toLocaleString()} = {currency.symbol}{currencyService.convert(sampleAmount, currency.code).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Exchange Rate Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Exchange Rate Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Exchange rates are based on PHP (Philippine Peso) as the base currency. 
              In production, these rates would be automatically updated from a live exchange rate API.
            </p>
            <Button variant="outline" className="w-full" disabled>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Rates (Requires API Key)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
