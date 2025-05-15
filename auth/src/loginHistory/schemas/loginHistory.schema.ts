import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LoginHistoryDocument = LoginHistory & Document;

@Schema({ timestamps: true })
export class LoginHistory {
  @Prop({ required: true })
  userId: string;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;
}

export const LoginHistorySchema = SchemaFactory.createForClass(LoginHistory);
