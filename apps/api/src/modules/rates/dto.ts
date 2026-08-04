import { IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateRateSourceDto {
  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  priority!: number;

  @IsInt()
  @Min(100)
  @Max(60000)
  refreshIntervalMs!: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdateRateSourceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(60000)
  refreshIntervalMs?: number;

  @IsOptional()
  @IsIn(["active", "paused", "disabled"])
  status?: string;
}

export class ManualOverrideDto {
  @IsString()
  baseAsset!: string;

  @IsString()
  quoteAsset!: string;

  @IsNumber()
  mid!: number;

  @IsOptional()
  @IsNumber()
  bid?: number;

  @IsOptional()
  @IsNumber()
  ask?: number;
}
