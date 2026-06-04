import { useQuery } from "@tanstack/react-query";

export const SUPPORTED_CURRENCIES = [
  { code: "BRL", symbol: "R$", name: "Real" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AOA", symbol: "Kz", name: "Kwanza" },
  { code: "MZN", symbol: "MT", name: "Metical" },
  { code: "CVE", symbol: "$", name: "Cabo Verde Escudo" },
  { code: "JPY", symbol: "¥", name: "Yen" },
  { code: "CNY", symbol: "¥", name: "Yuan" },
  { code: "ARS", symbol: "$", name: "Peso Argentino" },
];

export type Rates = Record<string, number>;

// Free, no-key exchange rate API; base USD
export const useExchangeRates = (base: string = "USD") => {
  return useQuery({
    queryKey: ["fx-rates", base],
    queryFn: async (): Promise<Rates> => {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (!res.ok) throw new Error("Falha ao obter taxas de câmbio");
      const json = await res.json();
      if (json.result !== "success") throw new Error("Resposta inválida");
      return json.rates as Rates;
    },
    staleTime: 1000 * 60 * 60, // 1h
    retry: 1,
  });
};

export const convert = (
  amount: number,
  from: string,
  to: string,
  ratesFromUSD: Rates | undefined,
): number => {
  if (!ratesFromUSD || from === to) return amount;
  const fromRate = from === "USD" ? 1 : ratesFromUSD[from];
  const toRate = to === "USD" ? 1 : ratesFromUSD[to];
  if (!fromRate || !toRate) return amount;
  const usd = amount / fromRate;
  return usd * toRate;
};

export const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};
