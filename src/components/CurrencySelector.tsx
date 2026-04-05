"use client";

import { useState, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currencyService, SUPPORTED_CURRENCIES } from "@/lib/currency-service";

export default function CurrencySelector() {
  const [currentCurrency, setCurrentCurrency] = useState(currencyService.getCurrentCurrency());

  useEffect(() => {
    const unsubscribe = currencyService.onCurrencyChange((currency) => {
      setCurrentCurrency(currency);
    });
    return unsubscribe;
  }, []);

  const handleCurrencyChange = (currencyCode: string) => {
    currencyService.setCurrency(currencyCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3">
          <span className="text-xl">{currentCurrency.flag}</span>
          <span className="font-semibold">{currentCurrency.code}</span>
          <span className="text-gray-400">{currentCurrency.symbol}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {SUPPORTED_CURRENCIES.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{currency.flag}</span>
              <div>
                <p className="font-medium">{currency.code}</p>
                <p className="text-xs text-gray-400">{currency.name}</p>
              </div>
            </div>
            {currentCurrency.code === currency.code && (
              <div className="h-2 w-2 rounded-full bg-indigo-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
