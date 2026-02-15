export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
    const CURRENCY_SYMBOLS: Record<string, string> = {
        'USD': '$',
        'INR': '₹',
        'EUR': '€',
        'GBP': '£'
    };

    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${symbol}${Math.abs(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const getMonthName = (month: number, year: number): string => {
    return new Date(year, month - 1).toLocaleString('default', {
        month: 'long',
        year: 'numeric'
    });
};
