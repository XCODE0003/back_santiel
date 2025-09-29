import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User } from '@prisma/client'

export const CurrentUser = createParamDecorator(
    (data: keyof User, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<{ user: User }>()
        const user = request.user

        if (!user) {
            return null
        }

        if (data === 'role') {
            return user.role as number
        }

        return data ? user[data] : user
    }
)
