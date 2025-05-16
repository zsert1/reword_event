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

export enum EventType {
  LOGIN_REWARD = 'LOGIN_REWARD',
  LEVEL_REACHED = 'LEVEL_REACHED',
  QUEST_CLEAR = 'QUEST_CLEAR',
  BOSS_KILL = 'BOSS_KILL',
  DUNGEON_CLEAR = 'DUNGEON_CLEAR',
  FRIEND_INVITE = 'FRIEND_INVITE',
  STREAK_LOGIN = 'STREAK_LOGIN',
}

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
