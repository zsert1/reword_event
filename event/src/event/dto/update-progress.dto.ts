import { IsMongoId, IsEnum } from 'class-validator';
import { ProgressStatus } from '../common/progress-status-type.enum';

export class UpdateProgressDto {
  @IsMongoId()
  userId: string;

  @IsMongoId()
  eventId: string;

  @IsEnum(ProgressStatus)
  progressStatus: ProgressStatus;
}
