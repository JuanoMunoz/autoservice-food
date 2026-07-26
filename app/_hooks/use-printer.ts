"use client";

import { useCallback, useState } from "react";

export function usePrinter() {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = useCallback(() => {
        setIsPrinting(true);
        setTimeout(() => {
            if (typeof window !== "undefined") {
                window.print();
            }
            setIsPrinting(false);
        }, 150);
    }, []);

    return {
        print: handlePrint,
        handlePrint,
        isPrinting,
    };
}
