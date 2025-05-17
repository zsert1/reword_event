import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EventType } from '../common/event-type.enum';

export type UserRewardHistoryDocument = UserRewardHistory & Document;

@Schema({ timestamps: true })
export class UserRewardHistory {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ type: String, enum: EventType, required: true })
  eventType: EventType;

  @Prop({ type: Array, required: true })
  rewards: {
    rewardType: string;
    value: string;
    quantity: number;
    description?: string;
  }[];

  @Prop()
  claimedAt: Date;

  @Prop({ type: Object })
  conditionSnapshot?: Record<string, any>;
}

export const UserRewardHistorySchema =
  SchemaFactory.createForClass(UserRewardHistory);
