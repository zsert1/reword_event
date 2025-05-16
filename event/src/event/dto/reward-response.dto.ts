import { RewardType } from './create-reward.dto';

export class RewardResponseDto {
  rewardId: string;
  rewardType: RewardType;
  value: string;
  description?: string;
}
