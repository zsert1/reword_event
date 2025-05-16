import { EventType } from './create-event.dto';

export class EventResponseDto {
  eventId: string;
  title: string;
  description?: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  condition?: Record<string, any>;
  isActive: boolean;
}
