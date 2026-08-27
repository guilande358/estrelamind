// Dados de recebimento manual (M-Pesa / e-Mola).
// Actualize estes valores com os seus números reais.
export const PAYMENT_ACCOUNTS = {
  mpesa: {
    label: "M-Pesa",
    number: "+258 85 757 5335",
    holder: "Elvez Ilidio Guilande",
  },
  emola: {
    label: "e-Mola",
    number: "+258 87 908 0335",
    holder: "Elvez Ilidio Guilande",
  },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_ACCOUNTS;

export const PLANS = {
  monthly: { amount: 299, days: 30 },
  yearly: { amount: 2990, days: 365 },
} as const;

export type PlanId = keyof typeof PLANS;

export const formatMzn = (value: number) =>
  `${value.toLocaleString("pt-MZ", { maximumFractionDigits: 0 })} MT`;
