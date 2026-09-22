export function serializePrisma<T>(value: T): T {
    if (value instanceof Date) {
        return value.toISOString() as T
    }

    if (Array.isArray(value)) {
        return value.map((item) => serializePrisma(item)) as T
    }

    if (value && typeof value === "object") {
        const objectValue = value as Record<string, unknown> & {
            constructor?: { name?: string }
            d?: unknown
            toFixed?: () => string
            toNumber?: () => number
        }

        if (
            objectValue.constructor?.name?.startsWith("Decimal") &&
            Array.isArray(objectValue.d) &&
            typeof objectValue.toFixed === "function" &&
            typeof objectValue.toNumber === "function"
        ) {
            return objectValue.toNumber() as T
        }

        return Object.fromEntries(
            Object.entries(objectValue).map(([key, entryValue]) => [key, serializePrisma(entryValue)])
        ) as T
    }

    return value
}