import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventAdminLogDocument = EventAdminLog & Document;

export enum AdminActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Schema({ timestamps: true })
export class EventAdminLog {
  @Prop({ required: true })
  adminId: string;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ enum: AdminActionType, required: true })
  action: AdminActionType;

  @Prop()
  memo?: string;
}

export const EventAdminLogSchema = SchemaFactory.createForClass(EventAdminLog);
