export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    const symbols: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹',
        'JPY': '¥'
    };

    const symbol = symbols[currency] || currency + ' ';
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
