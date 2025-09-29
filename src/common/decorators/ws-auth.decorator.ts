import { SetMetadata } from '@nestjs/common'

import { ROLES } from '@/api/user/user.constants'

export const WS_AUTH_KEY = 'ws-auth'
export const WsAuth = (...roles: ROLES[]) =>
    SetMetadata(WS_AUTH_KEY, roles || [])
