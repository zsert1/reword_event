import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RewardType = 'POINT' | 'ITEM' | 'COUPON' | 'EXP' | 'CURRENCY';

@Schema({ timestamps: true })
export class Reward {
  @Prop({ required: true })
  eventId: string;

  @Prop({
    required: true,
    enum: ['POINT', 'ITEM', 'COUPON', 'EXP', 'CURRENCY'],
  })
  rewardType: RewardType;

  @Prop({ required: true })
  value: string;

  @Prop()
  description?: string;
}

export type RewardDocument = Reward & Document;
export const RewardSchema = SchemaFactory.createForClass(Reward);
