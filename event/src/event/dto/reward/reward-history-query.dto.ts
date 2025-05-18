import { IsDateString } from 'class-validator';

export class RewardHistoryQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
