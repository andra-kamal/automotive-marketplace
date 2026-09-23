import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsInt()
  parent_id?: number;
}
