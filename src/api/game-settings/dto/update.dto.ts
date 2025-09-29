import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGameSettingDto {
  @Type(() => Number)
  @IsInt()
  @Min(-100, { message: 'minAdjustPercent не может быть менее -100' })
  minAdjustPercent: number;

  @Type(() => Number)
  @IsInt()
  @Max(100, { message: 'maxAdjustPercent не может быть более 100' })
  maxAdjustPercent: number;
}