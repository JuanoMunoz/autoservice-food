/** Grupo de pago para liquidación: split = efectivo + transferencia; null = no registrado */
export type SettlementPaymentGroup = "cash" | "transfer" | "split" | "unknown";

export function groupPaymentMethod(pm?: string | null): SettlementPaymentGroup {
  if (pm === "cash") return "cash";
  if (pm === "transfer") return "transfer";
  if (pm === "split") return "split";
  return "unknown";
}
