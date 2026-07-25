"use client";

import { useRouter } from "next/navigation";

export function useRedirect() {
    const router = useRouter();

    const redirect = (href: string) => {
        router.push(href);
    };

    const replace = (href: string) => {
        router.replace(href);
    };

    const back = () => {
        router.back();
    };

    return {
        redirect,
        replace,
        back,
    };
}