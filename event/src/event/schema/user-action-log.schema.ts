import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EventType } from '../common/event-type.enum';

export type UserActionLogDocument = UserActionLog & Document;

@Schema({ timestamps: true })
export class UserActionLog {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: EventType, required: true })
  actionType: EventType;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  occurredAt?: Date;
}

export const UserActionLogSchema = SchemaFactory.createForClass(UserActionLog);
