import { IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, Min } from "class-validator";

export class CreateAutomationRuleDto {
  @IsString()
  name!: string;

  @IsObject()
  trigger!: Record<string, unknown>;

  @IsArray()
  conditions!: Record<string, unknown>[];

  @IsArray()
  actions!: Record<string, unknown>[];

  @IsOptional()
  @IsObject()
  guards?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  cooldownSeconds?: number;
}

export class UpdateAutomationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  trigger?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  conditions?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  actions?: Record<string, unknown>[];

  @IsOptional()
  @IsObject()
  guards?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  cooldownSeconds?: number;
}

export class TestAutomationRuleDto {
  @IsObject()
  sampleInput!: Record<string, unknown>;
}
