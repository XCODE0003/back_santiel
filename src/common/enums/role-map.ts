enum ROLES {
    CLIENT = 0,
    WORKER = 1,
    ADMIN = 2
}

export const ROLE_MAP: Record<number, ROLES> = {
    0: ROLES.CLIENT,
    1: ROLES.WORKER,
    2: ROLES.ADMIN
}
