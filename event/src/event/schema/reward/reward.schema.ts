import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RewardType = 'POINT' | 'ITEM' | 'COUPON' | 'EXP' | 'CURRENCY';

export const REWARD_TYPE_ENUM: RewardType[] = [
  'POINT',
  'ITEM',
  'COUPON',
  'EXP',
  'CURRENCY',
];

@Schema({ timestamps: true })
export class Reward {
  @Prop({
    required: true,
    enum: REWARD_TYPE_ENUM,
  })
  rewardType: RewardType;

  @Prop({ required: true })
  value: string;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  description?: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type RewardDocument = Reward & Document;
export const RewardSchema = SchemaFactory.createForClass(Reward);
