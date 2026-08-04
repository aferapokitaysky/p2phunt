import { IsArray, IsIn, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateAccountDto {
  @IsString()
  platform!: string;

  @IsString()
  connector!: string;

  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  groupName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  groupName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsIn(["manual", "auto"])
  mode?: "manual" | "auto";
}

export class ConnectAccountSecretDto {
  @IsString()
  kind!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
