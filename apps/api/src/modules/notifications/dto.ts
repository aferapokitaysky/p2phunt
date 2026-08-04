import { IsBoolean, IsObject, IsOptional, IsString } from "class-validator";

export class CreateChannelDto {
  @IsString()
  type!: string;

  @IsString()
  name!: string;

  @IsObject()
  config!: Record<string, unknown>;
}

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
