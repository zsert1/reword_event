import { IsEnum, IsString, IsOptional, IsInt, Min } from 'class-validator';

export enum RewardType {
  POINT = 'POINT',
  ITEM = 'ITEM',
  COUPON = 'COUPON',
  EXP = 'EXP',
  CURRENCY = 'CURRENCY',
}

export class CreateRewardDto {
  @IsEnum(RewardType)
  rewardType: RewardType;

  @IsString()
  value: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  description?: string;
}
