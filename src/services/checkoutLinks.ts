export const WHOP_WINE_CHECKOUT_URL = import.meta.env.VITE_WHOP_WINE_CHECKOUT_URL || '';
export const WHOP_CUPIDO_CHECKOUT_URL = import.meta.env.VITE_WHOP_CUPIDO_CHECKOUT_URL || '';

type CheckoutContext = Record<string, string | number | boolean | null | undefined>;

const buildCheckoutUrl = (baseUrl: string, context: CheckoutContext = {}) => {
  const url = new URL(baseUrl);

  Object.entries(context).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

export const openWhopCheckout = (baseUrl: string, context?: CheckoutContext) => {
  if (!baseUrl) {
    throw new Error('Whop checkout URL is not configured.');
  }

  let checkoutUrl: string;
  try {
    checkoutUrl = buildCheckoutUrl(baseUrl, context);
  } catch {
    throw new Error('Whop checkout URL is invalid.');
  }

  window.location.assign(checkoutUrl);
};
