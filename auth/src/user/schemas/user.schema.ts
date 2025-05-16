import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export type Role = 'USER' | 'OPERATOR' | 'AUDITOR' | 'ADMIN';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, default: 'USER' })
  role: Role;
  @Prop({ default: true })
  isActive: boolean; // ✅ 논리 삭제용
}

export const UserSchema = SchemaFactory.createForClass(User);
