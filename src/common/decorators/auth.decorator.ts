import { applyDecorators, UseGuards } from '@nestjs/common'

import { JwtAuthGuard } from '@/api/auth/guards/jwt-auth.guard'
import { ROLES } from '@/api/user/user.constants'
import { Roles } from '@/common/decorators/roles.decorator'
import { RolesGuard } from '@/common/guards/roles.guard'

export const Auth = (...roles: ROLES[]) => {
    if (roles.length > 0) {
        return applyDecorators(
            UseGuards(JwtAuthGuard, RolesGuard),
            Roles(...roles)
        )
    }

    return applyDecorators(UseGuards(JwtAuthGuard))
}
