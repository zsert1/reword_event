import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import mongoose, { Model, Connection, Types } from 'mongoose';

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
import { EventResponseDto } from './dto/event-response.dto';
import { LogUserActionDto } from './dto/log-user-action.dto';
import { UserActionLog } from './schema/user-action-log.schema';
import { EventType } from './common/event-type.enum';
import { UserEventProgress } from './schema/user-event-progress.schema';
import { UserRewardHistory } from './schema/user-reward-history.schema';
import { ProgressStatus } from './common/progress-status-type.enum';

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
    @InjectModel(UserActionLog.name)
    private readonly userActionLogModel: Model<UserActionLog>,
    @InjectModel(UserEventProgress.name)
    private readonly userEventProgressModel: Model<UserEventProgress>,
    @InjectModel(UserRewardHistory.name)
    private readonly userRewardHistoryModel: Model<UserRewardHistory>,
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

  async getAllEvents(
    status?: 'ongoing' | 'ended',
  ): Promise<EventResponseDto[]> {
    const now = new Date();
    const filter: any = { isDeleted: false };

    if (status === 'ongoing') {
      filter.endDate = { $gt: now };
    } else if (status === 'ended') {
      filter.endDate = { $lt: now };
    }

    const events = await this.eventModel.find(filter).sort({ createdAt: -1 });
    return events.map((e) => ({
      eventId: e._id.toString(),
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      startDate: e.startDate,
      endDate: e.endDate,
      condition: e.condition,
      isActive: e.isActive,
    }));
  }

  async getEventById(id: string): Promise<EventResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('유효하지 않은 이벤트 ID 형식입니다.');
    }

    const event = await this.eventModel.findOne({ _id: id, isDeleted: false });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    return {
      eventId: event._id.toString(),
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      condition: event.condition,
      isActive: event.isActive,
    };
  }

  async getEventsByStatus(status: 'active' | 'ended' | 'all' = 'active') {
    const now = new Date();
    const query: any = { isDeleted: false };

    if (status === 'active') {
      query.endDate = { $gt: now };
    } else if (status === 'ended') {
      query.endDate = { $lte: now };
    }

    const events = await this.eventModel.find(query).lean();
    return events.map((e) => ({
      eventId: e._id.toString(),
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      startDate: e.startDate,
      endDate: e.endDate,
      condition: e.condition,
      isActive: e.isActive,
    }));
  }

  async logUserAction(userId: string, dto: LogUserActionDto) {
    const log = new this.userActionLogModel({
      userId,
      actionType: dto.actionType,
      metadata: dto.metadata,
      occurredAt: dto.occurredAt ?? new Date(),
    });

    await log.save();

    await this.updateProgressIfCompleted(userId, dto.actionType, dto.metadata);
    return { message: '유저 행동이 기록되었습니다.' };
  }

  async updateProgressIfCompleted(
    userId: string,
    actionType: EventType,
    metadata: Record<string, any>,
  ) {
    const now = new Date();

    const events = await this.eventModel.find({
      eventType: actionType,
      isDeleted: false,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    for (const event of events) {
      const isConditionMet = this.checkCondition(
        event.eventType,
        event.condition,
        metadata,
      );
      if (!isConditionMet) continue;

      const progress = await this.userEventProgressModel.findOne({
        userId,
        eventId: event._id,
      });

      if (progress) {
        if (progress.progressStatus !== ProgressStatus.IN_PROGRESS) continue;

        progress.progressStatus = ProgressStatus.COMPLETED;
        progress.completedAt = new Date();
        await progress.save();
      } else {
        await this.userEventProgressModel.create({
          userId: new Types.ObjectId(userId),
          eventId: event._id,
          progressStatus: ProgressStatus.COMPLETED,
          completedAt: new Date(),
        });
      }
    }
  }

  // 조건 검증
  checkCondition(
    eventType: EventType,
    condition: any,
    metadata: Record<string, any>,
  ): boolean {
    switch (eventType) {
      case EventType.BOSS_KILL:
        return metadata.bossId === condition.bossId;

      case EventType.STREAK_LOGIN:
        return metadata.currentStreak >= condition.requiredStreak;

      case EventType.QUEST_CLEAR:
        return metadata.questId === condition.questId;

      case EventType.DUNGEON_CLEAR:
        return metadata.dungeonLevel >= condition.requiredLevel;

      case EventType.FRIEND_INVITE:
        return metadata.inviteCount >= condition.minInvite;

      case EventType.LEVEL_REACHED:
        return metadata.level >= condition.requiredLevel;

      case EventType.LOGIN_REWARD:
        return true; // 로그인 보상은 단순 로그인으로 인정

      default:
        return false;
    }
  }

  async saveRewardHistory({
    userId,
    event,
    rewards,
    conditionSnapshot,
  }: {
    userId: string;
    event: EventDocument;
    rewards: any[];
    conditionSnapshot?: Record<string, any>;
  }) {
    await this.userRewardHistoryModel.create({
      userId,
      eventId: event._id,
      eventType: event.eventType,
      rewards,
      claimedAt: new Date(),
      conditionSnapshot,
    });
  }

  async claimReward(userId: string, eventId: string) {
    console.log('🔥 claimReward called with', typeof userId, typeof eventId);
    try {
      const event = await this.eventModel.findOne({
        _id: eventId,
        isDeleted: false,
      });
      if (!event) {
        throw new NotFoundException('이벤트를 찾을 수 없습니다.');
      }

      const progress = await this.userEventProgressModel.findOne({
        userId: this.toObjectId(userId),
        eventId: this.toObjectId(eventId),
      });

      if (progress && progress.rewardClaimedAt) {
        throw new BadRequestException('이미 보상을 지급받은 이벤트입니다.');
      }
      if (
        !progress ||
        (progress.progressStatus as ProgressStatus) !== ProgressStatus.COMPLETED
      ) {
        throw new BadRequestException(
          '이벤트 조건을 아직 만족하지 않았습니다.',
        );
      }

      const mappings = await this.mappingModel.find({
        eventId: this.toObjectId(eventId),
        isDeleted: false,
      });
      const rewardIds = mappings.map((m) => m.rewardId);

      const rewards = await this.rewardModel.find({
        _id: { $in: rewardIds },
        isDeleted: false,
      });

      if (rewards.length === 0) {
        throw new InternalServerErrorException(
          '이벤트에 연결된 보상이 존재하지 않습니다.',
        );
      }

      const rewardSnapshots = rewards.map((reward) => ({
        rewardType: reward.rewardType,
        value: reward.value,
        quantity: reward.quantity,
        description: reward.description,
      }));

      progress.progressStatus = ProgressStatus.REWARDED;
      progress.rewardClaimedAt = new Date();
      await progress.save();

      await this.saveRewardHistory({
        userId,
        event,
        rewards: rewardSnapshots,
        conditionSnapshot: event.condition,
      });

      return {
        status: 'SUCCESS',
        rewards: rewardSnapshots,
        message: '보상이 성공적으로 지급되었습니다.',
      };
    } catch (error) {
      console.error('🔥 claimReward 내부 에러:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  toObjectId = (id: string | Types.ObjectId): Types.ObjectId => {
    return typeof id === 'string' ? new Types.ObjectId(id) : id;
  };
}
