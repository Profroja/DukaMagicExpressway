/** Lipa numbers customers pay to before sending an order (managed by admins). */

export type PaymentAccount = {
  id: string;
  provider: string;
  provider_label: string;
  provider_name: string;
  number: string;
  account_name: string;
  note: string;
  is_active: boolean;
  sort_order: number;
};

/** Brand colours so customers recognise their provider at a glance. */
export const PROVIDER_STYLE: Record<string, { bg: string; text: string; short: string }> = {
  mpesa: { bg: "bg-[#E60000]", text: "text-white", short: "M-Pesa" },
  mixx: { bg: "bg-[#FFD200]", text: "text-[#0B2A6F]", short: "Mixx" },
  airtel_money: { bg: "bg-[#ED1C24]", text: "text-white", short: "Airtel" },
  halopesa: { bg: "bg-[#F58220]", text: "text-white", short: "Halo" },
  azampesa: { bg: "bg-[#00A3E0]", text: "text-white", short: "Azam" },
  ttcl_pesa: { bg: "bg-[#0066B3]", text: "text-white", short: "T-Pesa" },
  bank: { bg: "bg-navy", text: "text-white", short: "Bank" },
  other: { bg: "bg-slate-600", text: "text-white", short: "Pay" },
};

export function providerStyle(provider: string) {
  return PROVIDER_STYLE[provider] ?? PROVIDER_STYLE["other"]!;
}

export async function fetchPaymentAccounts(): Promise<PaymentAccount[]> {
  try {
    const res = await fetch("/api/payment-accounts/");
    if (!res.ok) return [];
    const data = (await res.json()) as { accounts?: PaymentAccount[] };
    return data.accounts ?? [];
  } catch {
    return [];
  }
}
