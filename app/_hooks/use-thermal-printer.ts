"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderResponse } from "@/types/Order";
import { buildReceiptBytes } from "@/lib/thermal/receipt";
import {
    isWebBluetoothSupported,
    reconnectKnownBleDevice,
    requestBlePrinter,
    type BlePrinterHandle,
} from "@/lib/thermal/ble-transport";

export type ThermalStatus =
    | "unsupported"
    | "disconnected"
    | "connecting"
    | "ready"
    | "printing";

const STORAGE_KEY = "cheesepapas-ble-device-id";

export function useThermalPrinter() {
    const [status, setStatus] = useState<ThermalStatus>(() =>
        typeof window !== "undefined" && isWebBluetoothSupported()
            ? "disconnected"
            : "unsupported",
    );
    const isSupported = status !== "unsupported";
    const [deviceName, setDeviceName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const handleRef = useRef<BlePrinterHandle | null>(null);
    const generationRef = useRef(0);

    const markDisconnected = useCallback(() => {
        generationRef.current += 1;
        handleRef.current = null;
        setDeviceName(null);
        setStatus("disconnected");
    }, []);

    // Reconexión silenciosa a un equipo ya autorizado (sin selector)
    useEffect(() => {
        if (!isSupported) return;
        let cancelled = false;
        const stored =
            typeof window !== "undefined"
                ? window.localStorage.getItem(STORAGE_KEY)
                : null;
        if (!stored) return;
        (async () => {
            try {
                const handle = await reconnectKnownBleDevice(stored, () => {
                    if (!cancelled) markDisconnected();
                });
                if (cancelled) {
                    handle?.disconnect();
                    return;
                }
                if (handle) {
                    handleRef.current = handle;
                    setDeviceName(handle.deviceName);
                    setStatus("ready");
                }
            } catch {
                // Silencioso: el usuario puede conectar manualmente
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isSupported, markDisconnected]);

    const connect = useCallback(async () => {
        setError(null);
        setStatus("connecting");
        try {
            const handle = await requestBlePrinter(() => markDisconnected());
            handleRef.current = handle;
            setDeviceName(handle.deviceName);
            setStatus("ready");
            try {
                window.localStorage.setItem(STORAGE_KEY, handle.deviceId);
            } catch {
                /* noop */
            }
        } catch (e) {
            setStatus(handleRef.current ? "ready" : "disconnected");
            const msg =
                e instanceof DOMException && e.name === "NotFoundError"
                    ? "No se seleccionó ninguna impresora."
                    : e instanceof Error
                        ? e.message
                        : "No se pudo conectar a la impresora.";
            setError(msg);
            throw new Error(msg);
        }
    }, [markDisconnected]);

    const disconnect = useCallback(() => {
        try {
            handleRef.current?.disconnect();
        } finally {
            markDisconnected();
        }
    }, [markDisconnected]);

    const printOrder = useCallback(async (order: OrderResponse) => {
        const handle = handleRef.current;
        if (!handle) throw new Error("Conecta primero la impresora térmica.");
        const gen = generationRef.current;
        setStatus("printing");
        setError(null);
        try {
            await handle.print(buildReceiptBytes(order));
            if (generationRef.current === gen) setStatus("ready");
        } catch (e) {
            if (generationRef.current === gen) setStatus("ready");
            const msg = e instanceof Error ? e.message : "Error al imprimir.";
            setError(msg);
            throw new Error(msg);
        }
    }, []);

    const printTest = useCallback(async () => {
        const handle = handleRef.current;
        if (!handle) throw new Error("Conecta primero la impresora térmica.");
        const gen = generationRef.current;
        setStatus("printing");
        try {
            // Ticket mínimo de prueba: INIT + centrado + texto + avance + corte
            const bytes = new Uint8Array([
                0x1b, 0x40, 0x1b, 0x74, 0x10,
                0x1b, 0x61, 0x01,
                ...Array.from("CHEESEPAPAS", (c) => c.charCodeAt(0)), 0x0a,
                ...Array.from("Prueba de conexion OK", (c) => c.charCodeAt(0)), 0x0a,
                0x1b, 0x61, 0x00, 0x1b, 0x64, 0x04, 0x1d, 0x56, 0x01,
            ]);
            await handle.print(bytes);
            if (generationRef.current === gen) setStatus("ready");
        } catch (e) {
            if (generationRef.current === gen) setStatus("ready");
            throw e;
        }
    }, []);

    return {
        isSupported,
        status,
        deviceName,
        error,
        isConnected: status === "ready" || status === "printing",
        isBusy: status === "connecting" || status === "printing",
        connect,
        disconnect,
        printOrder,
        printTest,
    };
}
