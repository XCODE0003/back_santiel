import { IsNumber, IsPositive } from 'class-validator'

import { CreatePromocodeDto } from './create.dto'

export class EditPromocodeDto extends CreatePromocodeDto {
    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false
        },
        {
            message: 'Id is required'
        }
    )
    @IsPositive({
        message: 'Id is required'
    })
    id: number
}
