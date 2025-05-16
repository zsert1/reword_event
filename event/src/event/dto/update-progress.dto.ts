import { IsMongoId, IsEnum } from 'class-validator';

export enum ProgressStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REWARDED = 'REWARDED',
}

export class UpdateProgressDto {
  @IsMongoId()
  userId: string;

  @IsMongoId()
  eventId: string;

  @IsEnum(ProgressStatus)
  progressStatus: ProgressStatus;
}
