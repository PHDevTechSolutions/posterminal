// Multi-Currency Support Service
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  exchangeRate: number; // Rate relative to PHP (base currency)
  decimalPlaces: number;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', exchangeRate: 1, decimalPlaces: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', exchangeRate: 0.018, decimalPlaces: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', exchangeRate: 0.016, decimalPlaces: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', exchangeRate: 0.014, decimalPlaces: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', exchangeRate: 2.7, decimalPlaces: 0 },
  { code: 'KRW', name: 'Korean Won', symbol: '₩', flag: '🇰🇷', exchangeRate: 24.5, decimalPlaces: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', exchangeRate: 0.13, decimalPlaces: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', exchangeRate: 0.024, decimalPlaces: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', exchangeRate: 0.027, decimalPlaces: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', exchangeRate: 0.025, decimalPlaces: 2 },
];

class CurrencyService {
  private currentCurrency: Currency = SUPPORTED_CURRENCIES[0];
  private listeners: ((currency: Currency) => void)[] = [];

  getCurrentCurrency(): Currency {
    return this.currentCurrency;
  }

  setCurrency(currencyCode: string) {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    if (currency) {
      this.currentCurrency = currency;
      this.listeners.forEach(listener => listener(currency));
    }
  }

  convert(amountInPHP: number, targetCurrencyCode?: string): number {
    const target = targetCurrencyCode 
      ? SUPPORTED_CURRENCIES.find(c => c.code === targetCurrencyCode)
      : this.currentCurrency;
    
    if (!target) return amountInPHP;
    return amountInPHP * target.exchangeRate;
  }

  convertToPHP(amount: number, fromCurrencyCode: string): number {
    const from = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrencyCode);
    if (!from) return amount;
    return amount / from.exchangeRate;
  }

  format(amount: number, currencyCode?: string): string {
    const currency = currencyCode 
      ? SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)
      : this.currentCurrency;
    
    if (!currency) return `₱${amount.toFixed(2)}`;
    
    const converted = currencyCode 
      ? amount 
      : this.convert(amount, currencyCode);
    
    return `${currency.symbol}${converted.toFixed(currency.decimalPlaces)}`;
  }

  formatWithCode(amount: number, currencyCode?: string): string {
    const currency = currencyCode 
      ? SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)
      : this.currentCurrency;
    
    if (!currency) return `₱${amount.toFixed(2)} PHP`;
    
    const converted = currencyCode 
      ? amount 
      : this.convert(amount, currencyCode);
    
    return `${currency.symbol}${converted.toFixed(currency.decimalPlaces)} ${currency.code}`;
  }

  onCurrencyChange(listener: (currency: Currency) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Update exchange rates (would fetch from API in production)
  async updateExchangeRates() {
    // In production, fetch from: 
    // - https://api.exchangerate-api.com/v4/latest/PHP
    // - Or use a paid service like XE.com, CurrencyLayer
    console.log('Exchange rates would be updated from API here');
  }
}

export const currencyService = new CurrencyService();
