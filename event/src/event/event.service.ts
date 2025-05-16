// event.service.ts
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import mongoose, { Model, Connection } from 'mongoose';

import { InjectConnection } from '@nestjs/mongoose';
import { EventDocument } from './schema/event.schema';
import { Reward, RewardDocument } from './schema/reward.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { EventRewardMapping } from './schema/event-reward-mapping.schema';
import { EventAdminLog } from './schema/event-admin-log.schema';
import {
  RewardActionType,
  RewardAdminLog,
} from './schema/reward-admin-log.schema';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(Reward.name)
    private readonly rewardModel: Model<RewardDocument>,
    @InjectModel(EventRewardMapping.name)
    private readonly mappingModel: Model<EventRewardMapping>,
    @InjectModel(EventAdminLog.name)
    private readonly logModel: Model<EventAdminLog>,
    @InjectModel(RewardAdminLog.name)
    private readonly rewardLogModel: Model<RewardAdminLog>,
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
        await this.rewardLogModel.create(
          [
            {
              adminId: dto.adminId,
              rewardId: reward._id,
              action: RewardActionType.CREATE,
              memo: `${rewardDto.rewardType} 보상(${rewardDto.value}) 이벤트로 생성됨`,
            },
          ],
          { session },
        );
      }

      // 3. 기존 보상 매핑
      for (const rewardId of dto.existingRewardIds ?? []) {
        //0. 아이디 명확한지 체크
        if (!mongoose.Types.ObjectId.isValid(rewardId)) {
          throw new BadRequestException(
            `올바르지 않은 보상 ID 형식입니다: ${rewardId}`,
          );
        }
        // 1. 존재하는 보상인지 확인
        const rewardExists = await this.rewardModel
          .exists({ _id: rewardId, isDeleted: false })
          .session(session);

        if (!rewardExists) {
          throw new BadRequestException(
            `존재하지 않는 보상 ID입니다: ${rewardId}`,
          );
        }
        // 2. 이미 매핑되어 있는지 확인
        const alreadyMapped = await this.mappingModel
          .findOne({
            eventId: event._id,
            rewardId: rewardId,
            isDeleted: false,
          })
          .session(session);

        // 3. 매핑이 없다면 생성
        if (!alreadyMapped) {
          const mapping = new this.mappingModel({
            eventId: event._id,
            rewardId: rewardId,
            isDeleted: false,
          });
          await mapping.save({ session });
        }
      }
      await this.logModel.create(
        [
          {
            adminId: dto.adminId,
            eventId: event._id,
            action: 'CREATE',
            memo: `이벤트 생성됨: ${dto.title}`,
          },
        ],
        { session },
      );
      await session.commitTransaction();
      return {
        eventId: event._id,
        message: '이벤트가 성공적으로 등록되었습니다.',
      };
    } catch (err) {
      await session.abortTransaction();

      console.error('[EVENT ERROR]', err); // 로그로 정확히 찍기

      if (err instanceof HttpException) {
        throw err;
      }

      throw new InternalServerErrorException(
        '이벤트 등록 실패: ' + err.message,
      );
    } finally {
      session.endSession();
    }
  }
}
