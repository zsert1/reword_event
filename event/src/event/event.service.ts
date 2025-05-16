// event.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model, Connection } from 'mongoose';

import { InjectConnection } from '@nestjs/mongoose';
import { EventDocument } from './schema/event.schema';
import { Reward, RewardDocument } from './schema/reward.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { EventRewardMapping } from './schema/event-reward-mapping.schema';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(Reward.name)
    private readonly rewardModel: Model<RewardDocument>,
    @InjectModel(EventRewardMapping.name)
    private readonly mappingModel: Model<EventRewardMapping>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async createEvent(dto: CreateEventDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. 이벤트 생성
      const event = new this.eventModel({
        ...dto,
        isDeleted: false,
        isActive: dto.isActive ?? true,
      });
      await event.save({ session });

      // 2. 새 보상 생성 및 매핑
      for (const rewardDto of dto.newRewards ?? []) {
        const reward = new this.rewardModel({
          ...rewardDto,
          isDeleted: false,
        });
        await reward.save({ session });

        const mapping = new this.mappingModel({
          eventId: event._id,
          rewardId: reward._id,
          isDeleted: false,
        });
        await mapping.save({ session });
      }

      // 3. 기존 보상 매핑
      for (const rewardId of dto.existingRewardIds ?? []) {
        const alreadyMapped = await this.mappingModel
          .findOne({
            eventId: event._id,
            rewardId: rewardId,
            isDeleted: false,
          })
          .session(session);

        if (!alreadyMapped) {
          const mapping = new this.mappingModel({
            eventId: event._id,
            rewardId: rewardId,
            isDeleted: false,
          });
          await mapping.save({ session });
        }
      }

      await session.commitTransaction();
      return {
        eventId: event._id,
        message: '이벤트가 성공적으로 등록되었습니다.',
      };
    } catch (err) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        '이벤트 등록 실패: ' + err.message,
      );
    } finally {
      session.endSession();
    }
  }
}
