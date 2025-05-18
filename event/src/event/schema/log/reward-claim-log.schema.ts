import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RewardClaimLogDocument = RewardClaimLog & Document;

@Schema({ timestamps: true })
export class RewardClaimLog {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Reward', required: true })
  rewardId: Types.ObjectId;

  @Prop({ default: false })
  isSuccess: boolean;

  @Prop()
  claimedAt?: Date;

  @Prop()
  failureReason?: string;
}

export const RewardClaimLogSchema =
  SchemaFactory.createForClass(RewardClaimLog);
