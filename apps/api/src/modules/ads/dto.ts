import { ArrayNotEmpty, IsArray, IsNumber, IsString } from "class-validator";

export class UpdateAdPriceDto {
  @IsString()
  price!: string;
}

export class BulkAdPriceDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  adIds!: string[];

  @IsNumber()
  priceDeltaPercent!: number;
}
