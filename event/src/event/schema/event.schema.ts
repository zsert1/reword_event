import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// 타입 정의
export type EventType =
  | 'LOGIN_REWARD' // 접속 시 보상
  | 'LEVEL_REACHED' // 특정 레벨 달성 시
  | 'QUEST_CLEAR' // 퀘스트 완료
  | 'BOSS_KILL' // 보스 몬스터 처치
  | 'DUNGEON_CLEAR' // 던전 클리어
  | 'FRIEND_INVITE' // 친구 초대
  | 'STREAK_LOGIN'; // 연속 출석

export const EVENT_TYPE_ENUM: EventType[] = [
  'LOGIN_REWARD',
  'LEVEL_REACHED',
  'QUEST_CLEAR',
  'BOSS_KILL',
  'DUNGEON_CLEAR',
  'FRIEND_INVITE',
  'STREAK_LOGIN',
];

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
    enum: EVENT_TYPE_ENUM, // enum 배열로 지정
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
