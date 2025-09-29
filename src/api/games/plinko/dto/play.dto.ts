import { IsInt, IsNumber, Min, IsIn, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export const RISK = ['easy', 'medium', 'hard'] as const
export type Risk = typeof RISK[number]

export class PlayDto {
  @IsNumber()
  @Min(0.01)
  betAmount: number

  @IsInt()
  rows: number

  @IsString()
  @IsIn(RISK)
  @ApiProperty({ enum: RISK }) // чтобы Swagger показал список
  risk: Risk

  @IsString()
  coinType: string
}