import { IsString, IsNotEmpty, IsInt, IsOptional, IsDecimal, IsObject, IsArray } from 'class-validator';

export class CreateListingDto {
  @IsInt()
  @IsNotEmpty()
  category_id: number;

  @IsString()
  @IsNotEmpty()
  make: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsInt()
  @IsNotEmpty()
  year: number;

  @IsInt()
  @IsNotEmpty()
  mileage: number;

  @IsString()
  @IsNotEmpty()
  price: string;

  @IsString()
  @IsNotEmpty()
  condition: string;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsString()
  fuel_type?: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @IsString()
  status?: string; // available, sold, pending

  @IsOptional()
  @IsObject()
  dynamic_attributes?: Record<string, any>;
}
