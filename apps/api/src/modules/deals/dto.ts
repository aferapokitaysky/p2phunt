import { IsArray, IsIn, IsOptional, IsString } from "class-validator";

export class UpdateDealDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  comment?: string;
}

export class AddDealNoteDto {
  @IsString()
  body!: string;
}

export class AddDealMessageDto {
  @IsString()
  body!: string;

  @IsIn(["inbound", "outbound"])
  direction!: "inbound" | "outbound";

  @IsOptional()
  @IsString()
  senderName?: string;
}
