
export type Role = "SUPER_ADMIN" | "ADMIN" | "USER";

export interface NavItem {
    href: string,
    icon: any,
    label: string,
    roles: Role[]
}

export interface SerializedUser {
    id: string
    name: string
    email: string
    role: Role
    createdAt: string
}