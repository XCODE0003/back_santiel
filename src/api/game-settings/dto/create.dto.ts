import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGameSettingDto {
  @Type(() => Number)
  @IsInt({ message: 'gameId должен быть целым числом' })
  gameId: number;

  @Type(() => Number)
  @IsInt()
  @Min(-100, { message: 'minAdjustPercent не может быть менее -100' })
  minAdjustPercent: number;

  @Type(() => Number)
  @IsInt()
  @Max(100, { message: 'maxAdjustPercent не может быть более 100' })
  maxAdjustPercent: number;
}