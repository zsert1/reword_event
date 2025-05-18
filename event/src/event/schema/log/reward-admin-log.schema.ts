import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type RewardAdminLogDocument = RewardAdminLog & Document;

export enum RewardActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Schema({ timestamps: true })
export class RewardAdminLog {
  @Prop({ type: Types.ObjectId, required: true })
  adminId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Reward', required: true })
  rewardId: Types.ObjectId;

  @Prop({ enum: RewardActionType, required: true })
  action: RewardActionType;

  @Prop()
  memo?: string;
}

export const RewardAdminLogSchema =
  SchemaFactory.createForClass(RewardAdminLog);
