/**
 * Helpers puros para el pago dividido (efectivo + transferencia).
 *
 * Este archivo NO es un módulo 'use server': las acciones de servidor lo importan
 * para sanear/validar los montos, y los componentes-cliente lo usan para mostrar
 * el desglose con exactly las mismas reglas.
 */
import type { PaymentType } from "@/types/Order";

export type PaymentSplitMethod = PaymentType | null;

export interface PaymentSplit {
  method: PaymentSplitMethod;
  cashAmount: number;
  transferAmount: number;
}

export type CuadreDirection = "driver_owes" | "business_owes" | "none";

/** Acepta número o cadena numérica (los inputs de la UI trabajan con strings). */
export function sanitizeAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  // Prisma Decimal (y otros objetos numéricos) llegan desde el servidor.
  if (typeof value === "object") {
    const numeric = value as { toNumber?: () => number; toString?: () => string };
    if (typeof numeric.toNumber === "function") {
      const n = numeric.toNumber();
      return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
    }
    if (typeof numeric.toString === "function") return sanitizeAmount(numeric.toString());
    return null;
  }
  const raw = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : value;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return Math.max(0, Math.round(raw));
}

/**
 * Valida y normaliza el reparto antes de persistirlo. El total SIEMPRE se
 * recalcula en servidor; los montos del cliente nunca pueden alterarlo.
 */
export function resolvePaymentSplit(
  method: unknown,
  cashAmount: unknown,
  transferAmount: unknown,
  orderTotal: number
): PaymentSplit {
  const total = Number.isFinite(orderTotal) ? orderTotal : 0;

  if (method === "split") {
    const cash = sanitizeAmount(cashAmount);
    const transfer = sanitizeAmount(transferAmount);
    if (cash === null || transfer === null) {
      throw new Error("Indica cuánto se pagó en efectivo y cuánto por transferencia.");
    }
    if (Math.abs(cash + transfer - total) > 2) {
      throw new Error(
        `Efectivo + transferencia debe sumar el total del pedido (${Math.round(total).toLocaleString("es-CO")}).`
      );
    }
    return { method: "split", cashAmount: cash, transferAmount: transfer };
  }

  if (method === "transfer") {
    return { method: "transfer", cashAmount: 0, transferAmount: Math.round(total) };
  }
  if (method === "cash") {
    return { method: "cash", cashAmount: Math.round(total), transferAmount: 0 };
  }
  return { method: null, cashAmount: 0, transferAmount: 0 };
}

/**
 * Reconstruye el reparto de registros históricos donde los montos aún no
 * existen: se deduce del método de pago y del total de la orden.
 */
export function snapshotPaymentSplit(
  method: unknown,
  cashAmount: unknown,
  transferAmount: unknown,
  orderTotal: number
): PaymentSplit {
  const total = Number.isFinite(orderTotal) ? orderTotal : 0;
  const cash = sanitizeAmount(cashAmount);
  const transfer = sanitizeAmount(transferAmount);

  if (method === "split") {
    return {
      method: "split",
      cashAmount: cash ?? 0,
      transferAmount: transfer ?? 0,
    };
  }
  if (method === "cash") {
    return { method: "cash", cashAmount: cash ?? Math.round(total), transferAmount: transfer ?? 0 };
  }
  if (method === "transfer") {
    return { method: "transfer", cashAmount: cash ?? 0, transferAmount: transfer ?? Math.round(total) };
  }
  return { method: null, cashAmount: cash ?? 0, transferAmount: transfer ?? 0 };
}

/**
 * Cuadre neto: el domiciliario se queda la ganancia del domicilio de la parte
 * cobrada en efectivo. La transferencia ya entró a la cuenta del negocio.
 *   efectivo - ganancia > 0 → el driver entrega esa diferencia
 *   efectivo - ganancia < 0 → el negocio le paga la diferencia al driver
 * Esto reproduce los casos antiguos (cash = total - domicilio, transfer = domicilio)
 * y añade el pago dividido sin necesidad de dos cuadres separados.
 */
export function settlementExpectation(
  cashAmount: number,
  earning: number,
  method: PaymentSplitMethod
): { expected: number; direction: CuadreDirection } {
  if (!method) return { expected: 0, direction: "none" };
  const net = Math.round(Number(cashAmount || 0) - Number(earning || 0));
  if (net > 0) return { expected: net, direction: "driver_owes" };
  if (net < 0) return { expected: -net, direction: "business_owes" };
  return { expected: 0, direction: "none" };
}

/** Etiqueta corta para comprobantes: "DIVIDIDO E$… / T$…". */
export function paymentSplitLabel(split: PaymentSplit): string {
  if (split.method === "split") {
    return `DIVIDIDO E${split.cashAmount.toLocaleString("es-CO")} / T${split.transferAmount.toLocaleString("es-CO")}`;
  }
  if (split.method === "cash") return "EFECTIVO";
  if (split.method === "transfer") return "TRANSFERENCIA";
  return "NO REGISTRADO";
}
