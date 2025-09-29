import { UseGuards } from '@nestjs/common'

import { ROLES } from '@/api/user/user.constants'
import { Roles } from '@/common/decorators'

import { JwtAuthGuard } from '../../api/auth/guards/jwt-auth.guard'

export const AuthRoles = (...roles: ROLES[]) =>
    UseGuards(JwtAuthGuard, Roles(...roles))
