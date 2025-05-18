import { IsMongoId } from 'class-validator';

export class ClaimRewardDto {
  @IsMongoId()
  userId: string;

  @IsMongoId()
  eventId: string;

  @IsMongoId()
  rewardId: string;
}
