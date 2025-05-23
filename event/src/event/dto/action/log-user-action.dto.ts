import { IsEnum, IsOptional, IsObject } from 'class-validator';
import { EventType } from '../../common/event-type.enum';

export class LogUserActionDto {
  @IsEnum(EventType)
  actionType: EventType;

  @IsObject()
  metadata: Record<string, any>;

  @IsOptional()
  occurredAt?: Date;
}
