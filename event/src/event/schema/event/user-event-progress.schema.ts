import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProgressStatus } from '../../common/progress-status-type.enum';

export type UserEventProgressDocument = UserEventProgress & Document;

@Schema({ timestamps: true })
export class UserEventProgress {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

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
