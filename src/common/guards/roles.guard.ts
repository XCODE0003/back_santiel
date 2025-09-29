import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { User } from '@prisma/client'
import { Request } from 'express'

import { ROLES } from '@/api/user/user.constants'
import { ROLES_KEY } from '@/common/decorators/roles.decorator'

export interface RequestWithUser extends Request {
    user: User
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<ROLES[]>(
            ROLES_KEY,
            context.getHandler()
        )
        if (!roles) {
            return true
        }

        const request = context.switchToHttp().getRequest<RequestWithUser>()
        
        const user = request.user
        if (!user) {
            throw new ForbiddenException('Произошла ошибка авторизации')
        }

        if (!roles.includes(user.role)) {
            throw new ForbiddenException(
                'У вас нет доступа к этому функционалу'
            )
        }



        return true
    }
}
