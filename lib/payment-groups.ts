/** Grupo de pago para liquidación: card+transfer = transferencia; null = no registrado */
export type SettlementPaymentGroup = "cash" | "transfer" | "unknown";

export function groupPaymentMethod(pm?: string | null): SettlementPaymentGroup {
  if (pm === "cash") return "cash";
  if (pm === "card" || pm === "transfer") return "transfer";
  return "unknown";
}
