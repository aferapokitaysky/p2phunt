import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateMarkupRuleDto {
  @IsIn(["global", "platform", "account", "ad"])
  scopeType!: "global" | "platform" | "account" | "ad";

  @IsOptional()
  @IsString()
  scopeId?: string;

  @IsOptional()
  @IsString()
  baseAsset?: string;

  @IsOptional()
  @IsString()
  quoteAsset?: string;

  @IsOptional()
  @IsIn(["buy", "sell"])
  side?: "buy" | "sell";

  @IsIn(["percent", "fixed"])
  markupType!: "percent" | "fixed";

  @IsNumber()
  value!: number;

  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class UpdateMarkupRuleDto {
  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
