import {
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min
  } from 'class-validator'
  import { Type } from 'class-transformer'
  
  export class GetAccountsDto {
    @Type(() => Number)
    @IsNumber()
    @IsPositive({
      message: 'Страница должна быть больше 0'
    })
    @Min(1, {
      message: 'Страница должна быть больше 0'
    })
    page: number = 1
  
    @IsOptional()
    @IsString({
      message: 'Поиск должен быть строкой'
    })
    search?: string
  }
  