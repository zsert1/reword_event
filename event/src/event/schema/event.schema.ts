import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EVENT_TYPE_ENUM, EventType } from '../common/event-type.enum';

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    required: true,
    enum: EVENT_TYPE_ENUM,
  })
  eventType: EventType;

  @Prop({ type: Object, default: {} })
  condition: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);
