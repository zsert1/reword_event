import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserEventProgressDocument = UserEventProgress & Document;

export enum ProgressStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REWARDED = 'REWARDED',
}

@Schema({ timestamps: true })
export class UserEventProgress {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ enum: ProgressStatus, default: ProgressStatus.IN_PROGRESS })
  progressStatus: ProgressStatus;

  @Prop()
  completedAt?: Date;

  @Prop()
  rewardClaimedAt?: Date;
}

export const UserEventProgressSchema =
  SchemaFactory.createForClass(UserEventProgress);
