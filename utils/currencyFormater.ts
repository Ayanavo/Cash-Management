export function formatCurrency(value: number, currencySymbol: string): string {
	try {
		// Prefer Intl when available
		// eslint-disable-next-line no-undef
		if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
			return `${currencySymbol}${new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(value)}`;
		}
		// Fallback
		const fixed = value.toFixed(2);
		const parts = fixed.split('.');
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		return `${currencySymbol}${parts.join('.')}`;
	} catch {
		return `${currencySymbol}${value.toFixed(2)}`;
	}
};