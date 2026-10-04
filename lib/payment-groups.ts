/** Grupo de pago para liquidación: transfer = transferencia; null = no registrado */
export type SettlementPaymentGroup = "cash" | "transfer" | "unknown";

export function groupPaymentMethod(pm?: string | null): SettlementPaymentGroup {
  if (pm === "cash") return "cash";
  if (pm === "transfer") return "transfer";
  return "unknown";
}
