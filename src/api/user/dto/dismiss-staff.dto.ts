import { IsNumber, IsPositive } from 'class-validator'

export class DismissStaffDto {
    @IsNumber({}, { message: 'ID должен быть числом' })
    @IsPositive({ message: 'ID должен быть положительным числом' })
    id: number
}
