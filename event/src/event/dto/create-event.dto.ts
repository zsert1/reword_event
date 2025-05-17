import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRewardDto } from './create-reward.dto';
import { EventType } from '../common/event-type.enum';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  @IsEnum(EventType)
  eventType: EventType;
  @IsOptional()
  @IsObject()
  condition?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  adminId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRewardDto)
  newRewards?: CreateRewardDto[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  existingRewardIds?: string[];
}
