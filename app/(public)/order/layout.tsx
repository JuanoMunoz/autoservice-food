import ActiveOrderFloating from './_components/active-order-floating'

export default function OrderLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <ActiveOrderFloating />
        </>
    )
}
