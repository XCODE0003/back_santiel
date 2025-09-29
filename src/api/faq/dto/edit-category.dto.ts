import { IsNotEmpty, IsString } from 'class-validator';

export class EditCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}