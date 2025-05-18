import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { chunk } from 'lodash';
import mongoose, { Model, Connection, Types, isValidObjectId } from 'mongoose';

import { InjectConnection } from '@nestjs/mongoose';
import { EventDocument } from './schema/event/event.schema';
import { Reward, RewardDocument } from './schema/reward/reward.schema';
import { CreateEventDto } from './dto/event/create-event.dto';
import { EventRewardMapping } from './schema/mapping/event-reward-mapping.schema';
import {
  AdminActionType,
  EventAdminLog,
} from './schema/event/event-admin-log.schema';
import {
  RewardActionType,
  RewardAdminLog,
} from './schema/log/reward-admin-log.schema';
import { EventResponseDto } from './dto/event/event-response.dto';
import { LogUserActionDto } from './dto/action/log-user-action.dto';
import { UserActionLog } from './schema/log/user-action-log.schema';
import { EventType } from './common/event-type.enum';
import { UserEventProgress } from './schema/event/user-event-progress.schema';
import { UserRewardHistory } from './schema/reward/user-reward-history.schema';
import { ProgressStatus } from './common/progress-status-type.enum';
import { UpdateEventDto } from './dto/event/update-event.dto';
import { CreateRewardDto } from './dto/reward/create-reward.dto';

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
    private readonly eventAdminLogModel: Model<EventAdminLog>,
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
              adminId: this.toObjectId(dto.adminId),
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
      await this.eventAdminLogModel.create(
        [
          {
            adminId: this.toObjectId(dto.adminId),
            eventId: event._id,
            action: AdminActionType.CREATE,
            memo: `이벤트 생성됨: ${dto.title}`,
          },
        ],
        { session },
      );
      if (dto.userIds?.length) {
        const userChunks = chunk(dto.userIds, 1000); // 1000명씩 나눔

        for (const userBatch of userChunks) {
          const progressOps = [];

          for (const userId of userBatch) {
            try {
              const userObjId = this.toObjectId(userId);

              const logs = await this.userActionLogModel
                .find({
                  userId: userObjId,
                  actionType: event.eventType,
                  occurredAt: { $gte: event.startDate, $lte: event.endDate },
                })
                .lean();

              const matched = logs.find((log) =>
                this.checkCondition(
                  event.eventType,
                  event.condition,
                  log.metadata,
                ),
              );

              const alreadyExists = await this.userEventProgressModel.exists({
                userId: userObjId,
                eventId: event._id,
              });

              if (!alreadyExists) {
                progressOps.push({
                  insertOne: {
                    document: {
                      userId: userObjId,
                      eventId: event._id,
                      progressStatus: matched
                        ? ProgressStatus.COMPLETED
                        : ProgressStatus.NOT_STARTED,
                      completedAt: matched?.occurredAt,
                    },
                  },
                });
              }
            } catch (err) {
              console.warn(
                `⚠ 유저(${userId}) progress 생성 중 오류 발생 → 무시됨: ${err.message}`,
              );
              continue;
            }
          }

          if (progressOps.length > 0) {
            try {
              await this.userEventProgressModel.bulkWrite(progressOps);
            } catch (err) {
              console.error('❌ bulkWrite 실패:', err.message);
            }
          }
        }
      }

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
      userId: this.toObjectId(userId),
      eventId: event._id,
      eventType: event.eventType,
      rewards,
      claimedAt: new Date(),
      conditionSnapshot,
    });
  }

  async claimReward(userId: string, eventId: string) {
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
      throw new InternalServerErrorException(error.message);
    }
  }
  toObjectId = (id: string | Types.ObjectId): Types.ObjectId => {
    if (typeof id === 'string' && isValidObjectId(id)) {
      return new Types.ObjectId(id);
    }
    return id as Types.ObjectId;
  };

  async getUserRewardHistory(userId: string, startDate: Date, endDate: Date) {
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setUTCHours(23, 59, 59, 999);

    const history = await this.userRewardHistoryModel
      .find({
        userId: this.toObjectId(userId),
        claimedAt: { $gte: startDate, $lte: adjustedEndDate },
      })
      .sort({ claimedAt: 1 })
      .lean();
    return history.map((entry) => ({
      eventType: entry.eventType,
      rewards: entry.rewards,
      claimedAt: entry.claimedAt,
    }));
  }

  async getUserEventProgress(userId: string, eventId: string) {
    const progress = await this.userEventProgressModel.findOne({
      userId: this.toObjectId(userId),
      eventId: this.toObjectId(eventId),
    });

    if (!progress) {
      return {
        progressStatus: 'NOT_STARTED',
        completedAt: null,
        rewardClaimedAt: null,
      };
    }

    return {
      progressStatus: progress.progressStatus,
      completedAt: progress.completedAt ?? null,
      rewardClaimedAt: progress.rewardClaimedAt ?? null,
    };
  }

  async getUserAllProgress(userId: string) {
    const progresses = await this.userEventProgressModel
      .find({ userId: this.toObjectId(userId) })
      .lean();

    return progresses.map((p) => ({
      eventId: p.eventId,
      progressStatus: p.progressStatus,
      completedAt: p.completedAt ?? null,
      rewardClaimedAt: p.rewardClaimedAt ?? null,
    }));
  }

  async updateEvent(eventId: string, dto: UpdateEventDto, adminId: string) {
    const updatePayload: Record<string, any> = {};
    const changedFields: string[] = [];

    // 기본 필드 업데이트 추적
    for (const key of [
      'title',
      'description',
      'startDate',
      'endDate',
      'condition',
      'isActive',
    ]) {
      if (dto[key] !== undefined) {
        updatePayload[key] = dto[key];
        changedFields.push(key);
      }
    }

    // 이벤트 수정
    const updated = await this.eventModel.findOneAndUpdate(
      { _id: this.toObjectId(eventId), isDeleted: false },
      { $set: updatePayload },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    // ✅ 보상 추가
    const rewardLog: string[] = [];

    if (dto.addRewardIds?.length) {
      for (const rewardId of dto.addRewardIds) {
        const exists = await this.mappingModel.exists({
          eventId: updated._id,
          rewardId: this.toObjectId(rewardId),
          isDeleted: false,
        });
        if (!exists) {
          await this.mappingModel.create({
            eventId: updated._id,
            rewardId: this.toObjectId(rewardId),
            isDeleted: false,
          });
          rewardLog.push(`보상 추가됨: ${rewardId}`);
        }
      }
    }

    if (dto.removeRewardIds?.length) {
      for (const rewardId of dto.removeRewardIds) {
        const deleted = await this.mappingModel.findOneAndUpdate(
          {
            eventId: updated._id,
            rewardId: this.toObjectId(rewardId),
            isDeleted: false,
          },
          { $set: { isDeleted: true } },
        );
        if (deleted) {
          rewardLog.push(`보상 제거됨: ${rewardId}`);
        }
      }
    }

    // ✅ 로그 저장
    const memoParts = [];
    if (changedFields.length)
      memoParts.push(`필드 변경: [${changedFields.join(', ')}]`);
    if (rewardLog.length) memoParts.push(`보상 변경: ${rewardLog.join(', ')}`);

    await this.eventAdminLogModel.create({
      adminId: this.toObjectId(adminId),
      eventId: updated._id,
      action: AdminActionType.UPDATE,
      memo: memoParts.join(' / ') || '변경 없음',
    });

    return {
      eventId: updated._id,
      message: '이벤트가 성공적으로 수정되었습니다.',
    };
  }

  async deleteEvent(eventId: string, adminId: string) {
    const deleted = await this.eventModel.findOneAndUpdate(
      { _id: this.toObjectId(eventId), isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true },
    );

    if (!deleted) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    await this.eventAdminLogModel.create({
      adminId: this.toObjectId(adminId),
      eventId: deleted._id,
      action: AdminActionType.DELETE,
      memo: '이벤트 삭제됨',
    });

    return {
      eventId: deleted._id,
      message: '이벤트가 성공적으로 삭제되었습니다.',
    };
  }

  async getAllRewards() {
    return this.rewardModel
      .find({ isDeleted: false })
      .select('rewardType value quantity description')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getRewardById(id: string) {
    const reward = await this.rewardModel
      .findOne({
        _id: this.toObjectId(id),
        isDeleted: false,
      })
      .lean();

    if (!reward) {
      throw new NotFoundException('보상을 찾을 수 없습니다.');
    }

    return reward;
  }

  async createReward(dto: CreateRewardDto, adminId: string) {
    const reward = await this.rewardModel.create({
      rewardType: dto.rewardType,
      value: dto.value,
      quantity: dto.quantity,
      description: dto.description,
      isDeleted: false,
    });

    const logs: string[] = [];

    if (dto.eventId) {
      await this.rewardLogModel.create({
        adminId: this.toObjectId(adminId),
        rewardId: reward._id,
        action: RewardActionType.CREATE,
        memo: `보상 생성됨${logs.length ? ' / ' + logs.join(', ') : ''}`,
      });

      await this.mappingModel.create({
        eventId: this.toObjectId(dto.eventId),
        rewardId: reward._id,
        isDeleted: false,
      });
      logs.push(`이벤트(${dto.eventId})에 연결됨`);
    }

    return {
      rewardId: reward._id,
      message: '보상이 성공적으로 생성되었습니다.',
    };
  }
}
