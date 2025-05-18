import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Event } from './schema/event/event.schema';
import { Reward } from './schema/reward/reward.schema';
import { EventAdminLog } from './schema/event/event-admin-log.schema';
import { RewardAdminLog } from './schema/log/reward-admin-log.schema';
import { EventRewardMapping } from './schema/mapping/event-reward-mapping.schema';
import { UserEventProgress } from './schema/event/user-event-progress.schema';
import { UserActionLog } from './schema/log/user-action-log.schema';
import { UserRewardHistory } from './schema/reward/user-reward-history.schema';
import { EventType } from './common/event-type.enum';
import { RewardType } from './dto/reward/create-reward.dto';

describe('EventService', () => {
  let service: EventService;
  let mockEventModel: any;
  let mockRewardModel: any;
  let mockMappingModel: any;
  let mockEventLogModel: any;
  let mockRewardLogModel: any;
  let mockConnection: any;
  let mockSession: any;
  let mockUserActionLogModel: any;
  let mockUserProgressModel: any;
  let mockUserRewardHistoryModel: any;
  const createdMappings = [];
  beforeEach(async () => {
    createdMappings.length = 0;
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    mockUserActionLogModel = jest.fn();
    mockUserProgressModel = {
      find: jest.fn(),
      updateOne: jest.fn(),
    };
    const leanMock = jest.fn();
    const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
    const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
    const findMock = jest.fn().mockReturnValue({ sort: sortMock });

    mockUserRewardHistoryModel = {
      find: findMock,
    };
    mockConnection = {
      startSession: jest.fn().mockResolvedValue(mockSession),
    };

    mockEventModel = Object.assign(
      jest.fn().mockImplementation((dto) => {
        return {
          _id: 'event1',
          save: jest.fn().mockResolvedValue({
            _id: 'event1',
            ...dto,
          }),
        };
      }),
      {
        find: jest.fn(), // ✅ static 메서드 추가
        findOne: jest.fn(), // ✅ static 메서드 추가
      },
    );

    mockRewardModel = jest.fn().mockImplementation((dto) => ({
      save: jest.fn().mockResolvedValue({ _id: 'reward1', ...dto }),
    }));

    mockMappingModel = jest.fn().mockImplementation((dto) => {
      const instance = {
        save: jest.fn().mockResolvedValue({ _id: 'mapping1', ...dto }),
      };
      createdMappings.push(instance);
      return instance;
    });

    mockEventLogModel = {
      create: jest.fn().mockResolvedValue({}),
    };

    mockRewardLogModel = {
      create: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: getModelToken(Event.name), useValue: mockEventModel },
        { provide: getModelToken(Reward.name), useValue: mockRewardModel },
        {
          provide: getModelToken(EventRewardMapping.name),
          useValue: mockMappingModel,
        },
        {
          provide: getModelToken(EventAdminLog.name),
          useValue: mockEventLogModel,
        },
        {
          provide: getModelToken(RewardAdminLog.name),
          useValue: mockRewardLogModel,
        },
        { provide: getConnectionToken(), useValue: mockConnection },
        {
          provide: getModelToken(UserActionLog.name),
          useValue: mockUserActionLogModel,
        },
        {
          provide: getModelToken(UserEventProgress.name),
          useValue: mockUserProgressModel,
        },
        {
          provide: getModelToken(UserRewardHistory.name),
          useValue: mockUserRewardHistoryModel,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('보상이 있는 이벤트를 만들고 생성에 대한 기록을 해야 합니다.', async () => {
    const dto = {
      title: 'Test Event',
      eventType: 'LOGIN_REWARD',
      startDate: new Date(),
      endDate: new Date(),
      adminId: 'admin123',
      newRewards: [
        {
          rewardType: 'POINT',
          value: '500',
          description: '보상 설명',
        },
      ],
    };

    const result = await service.createEvent(dto as any);

    expect(result).toEqual({
      eventId: 'event1',
      message: '이벤트가 성공적으로 등록되었습니다.',
    });

    expect(mockEventLogModel.create).toHaveBeenCalled();
    expect(mockRewardLogModel.create).toHaveBeenCalled();
    expect(createdMappings[0].save).toHaveBeenCalled();
  });
  it('존재하지 않는 보상 ID는 실패처리', async () => {
    const fakeId = '507f1f77bcf86cd799439011'; // 유효한 ObjectId

    mockRewardModel.exists = jest.fn().mockReturnValue({
      session: jest.fn().mockResolvedValue(false),
    });

    const dto = {
      title: 'Invalid Reward Test',
      eventType: 'LOGIN_REWARD',
      startDate: new Date(),
      endDate: new Date(),
      adminId: 'admin123',
      existingRewardIds: [fakeId],
    };

    await expect(service.createEvent(dto as any)).rejects.toThrowError(
      `존재하지 않는 보상 ID입니다: ${fakeId}`,
    );

    expect(mockRewardModel.exists).toHaveBeenCalledWith({
      _id: fakeId,
      isDeleted: false,
    });
  });

  describe('getEventsByStatus', () => {
    it('활성화된 이벤트만 반환힙니디.', async () => {
      const now = new Date();

      const mockEvents = [
        {
          _id: 'active1',
          title: 'Active Event',
          description: 'Still ongoing',
          eventType: 'LOGIN_REWARD',
          startDate: new Date(now.getTime() - 1000 * 60),
          endDate: new Date(now.getTime() + 1000 * 60 * 60),
          condition: {},
          isActive: true,
          isDeleted: false,
        },
        {
          _id: 'ended1',
          title: 'Ended Event',
          description: 'Already finished',
          eventType: 'LEVEL_REACHED',
          startDate: new Date(now.getTime() - 1000 * 60 * 60 * 2),
          endDate: new Date(now.getTime() - 1000 * 60),
          condition: {},
          isActive: true,
          isDeleted: false,
        },
      ];

      const findMock = jest.fn().mockReturnValue({
        lean: () => Promise.resolve([mockEvents[0]]),
      });

      mockEventModel.find = findMock;

      const result = await service.getEventsByStatus('active');

      expect(findMock).toHaveBeenCalledWith({
        isDeleted: false,
        endDate: { $gt: expect.any(Date) },
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Active Event');
    });

    it('종료된 이벤트만 반환 합니다', async () => {
      const now = new Date();

      const mockEvents = [
        {
          _id: 'ended1',
          title: 'Ended Event',
          description: 'Already finished',
          eventType: 'LEVEL_REACHED',
          startDate: new Date(now.getTime() - 1000 * 60 * 60 * 2),
          endDate: new Date(now.getTime() - 1000 * 60),
          condition: {},
          isActive: true,
          isDeleted: false,
        },
      ];

      const findMock = jest.fn().mockReturnValue({
        lean: () => Promise.resolve(mockEvents),
      });

      mockEventModel.find = findMock;

      const result = await service.getEventsByStatus('ended');

      expect(findMock).toHaveBeenCalledWith({
        isDeleted: false,
        endDate: { $lte: expect.any(Date) },
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Ended Event');
    });
  });

  describe('getEventById', () => {
    it('존재하는 ID로 이벤트 단건 조회가 되어야 합니다', async () => {
      const id = '507f1f77bcf86cd799439011';
      const mockEvent = {
        _id: id,
        title: 'Test Event',
        description: '설명',
        eventType: 'LOGIN_REWARD',
        startDate: new Date(),
        endDate: new Date(),
        condition: { level: 10 },
        isActive: true,
        isDeleted: false,
      };

      mockEventModel.findOne = jest.fn().mockResolvedValue(mockEvent);

      const result = await service.getEventById(id);

      expect(mockEventModel.findOne).toHaveBeenCalledWith({
        _id: id,
        isDeleted: false,
      });
      expect(result.eventId).toBe(id);
      expect(result.title).toBe('Test Event');
    });

    it('형식이 잘못된 ID로 조회하면 예외처리로 전달합니다.', async () => {
      const invalidId = 'not-an-objectid';

      await expect(service.getEventById(invalidId)).rejects.toThrowError(
        '유효하지 않은 이벤트 ID 형식입니다.',
      );
    });

    it('존재하지 않는 ID로 조회하면 NotFound 예외처리 되어야합니다.', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockEventModel.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.getEventById(id)).rejects.toThrowError(
        '이벤트를 찾을 수 없습니다.',
      );
    });
  });
  describe('logUserAction', () => {
    it('유저 행동 로그가 저장되고 updateProgressIfCompleted가 호출되어야 한다', async () => {
      const userId = 'user123';
      const dto = {
        actionType: EventType.BOSS_KILL,
        metadata: { bossId: 'dragon_lord' },
        occurredAt: new Date('2025-05-18T10:30:00Z'),
      };

      const saveMock = jest.fn().mockResolvedValue({});
      mockUserActionLogModel.mockImplementation(() => ({
        save: saveMock,
      }));

      const updateSpy = jest
        .spyOn(service as any, 'updateProgressIfCompleted') // private이면 as any로 접근
        .mockResolvedValue(undefined);

      const result = await service.logUserAction(userId, dto);

      expect(mockUserActionLogModel).toHaveBeenCalledWith({
        userId,
        actionType: dto.actionType,
        metadata: dto.metadata,
        occurredAt: dto.occurredAt,
      });

      expect(saveMock).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith(
        userId,
        dto.actionType,
        dto.metadata,
      );
      expect(result).toEqual({ message: '유저 행동이 기록되었습니다.' });
    });
  });
  describe('claimReward', () => {
    it('조건이 만족된 경우 보상이 지급되어야 한다', async () => {
      const eventId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';

      const mockEvent = {
        _id: eventId,
        eventType: EventType.LOGIN_REWARD,
        condition: {},
        isDeleted: false,
      };

      const mockProgress = {
        progressStatus: 'COMPLETED',
        rewardClaimedAt: null,
        save: jest.fn(),
      };

      const mockMapping = [{ rewardId: 'reward1' }];
      const mockRewards = [
        {
          rewardType: 'POINT',
          value: '500',
          quantity: 1,
          description: 'test',
        },
      ];

      mockEventModel.findOne = jest.fn().mockResolvedValue(mockEvent);
      mockUserProgressModel.findOne = jest.fn().mockResolvedValue(mockProgress);
      mockMappingModel.find = jest.fn().mockResolvedValue(mockMapping);
      mockRewardModel.find = jest.fn().mockResolvedValue(mockRewards);
      mockUserRewardHistoryModel.create = jest.fn();

      const result = await service.claimReward(userId, eventId);

      expect(result.status).toBe('SUCCESS');
      expect(result.rewards).toHaveLength(1);
      expect(mockProgress.save).toHaveBeenCalled();
      expect(mockUserRewardHistoryModel.create).toHaveBeenCalled();
    });
  });

  describe('getUserRewardHistory', () => {
    it('유저의 보상 이력을 반환한다', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const startDate = new Date('2025-05-01');
      const endDate = new Date('2025-05-18');

      mockUserRewardHistoryModel.find = jest.fn().mockReturnValue({
        sort: () => ({
          lean: () =>
            Promise.resolve([
              {
                eventType: EventType.LOGIN_REWARD,
                rewards: [{ value: 500 }],
                claimedAt: new Date(),
              },
            ]),
        }),
      });

      const result = await service.getUserRewardHistory(
        userId,
        startDate,
        endDate,
      );

      expect(result).toHaveLength(1);
      expect(result[0].rewards[0].value).toBe(500);
    });
  });
  describe('getUserEventProgress', () => {
    it('이벤트 참여 이력을 반환한다', async () => {
      mockUserProgressModel.findOne = jest.fn().mockResolvedValue({
        progressStatus: 'COMPLETED',
        completedAt: new Date(),
        rewardClaimedAt: new Date(),
      });

      const result = await service.getUserEventProgress('user123', 'event123');

      expect(result.progressStatus).toBe('COMPLETED');
    });
  });

  describe('getUserAllProgress', () => {
    it('유저의 모든 이벤트 참여 이력을 반환한다', async () => {
      mockUserProgressModel.find = jest.fn().mockReturnValue({
        lean: () =>
          Promise.resolve([
            {
              eventId: 'event1',
              progressStatus: 'REWARDED',
              completedAt: new Date(),
              rewardClaimedAt: new Date(),
            },
          ]),
      });

      const result = await service.getUserAllProgress('user123');

      expect(result).toHaveLength(1);
      expect(result[0].progressStatus).toBe('REWARDED');
    });
  });

  describe('updateEvent', () => {
    it('이벤트의 제목과 보상을 수정하고 로그를 남긴다', async () => {
      mockEventModel.findOneAndUpdate = jest.fn().mockResolvedValue({
        _id: 'event123',
        title: 'Updated',
      });

      mockMappingModel.exists = jest.fn().mockResolvedValue(false);
      mockMappingModel.create = jest.fn();
      mockMappingModel.findOneAndUpdate = jest.fn().mockResolvedValue(true);
      mockEventLogModel.create = jest.fn();

      const dto = {
        title: 'Updated',
        addRewardIds: ['reward1'],
        removeRewardIds: ['reward2'],
      };

      const result = await service.updateEvent('event123', dto, 'admin123');

      expect(result.message).toContain('성공');
      expect(mockEventLogModel.create).toHaveBeenCalled();
    });
  });

  describe('deleteEvent', () => {
    it('이벤트를 삭제하고 로그를 남긴다', async () => {
      mockEventModel.findOneAndUpdate = jest.fn().mockResolvedValue({
        _id: 'event123',
      });

      mockEventLogModel.create = jest.fn();

      const result = await service.deleteEvent('event123', 'admin123');

      expect(result.message).toContain('삭제');
      expect(mockEventLogModel.create).toHaveBeenCalled();
    });
  });

  describe('getAllRewards', () => {
    it('삭제되지 않은 보상 목록을 반환한다', async () => {
      mockRewardModel.find = jest.fn().mockReturnValue({
        select: () => ({
          sort: () => ({
            lean: () =>
              Promise.resolve([
                {
                  rewardType: 'POINT',
                  value: '500',
                },
              ]),
          }),
        }),
      });

      const result = await service.getAllRewards();

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('500');
    });
  });
  describe('getRewardById', () => {
    it('ID로 보상 단건 조회를 반환한다', async () => {
      const reward = { rewardType: 'ITEM', value: 'item1' };
      mockRewardModel.findOne = jest.fn().mockReturnValue({
        lean: () => Promise.resolve(reward),
      });

      const result = await service.getRewardById('507f1f77bcf86cd799439011');
      expect(result.rewardType).toBe('ITEM');
    });
  });

  describe('createReward', () => {
    it('보상 생성 후 이벤트에 연결한다', async () => {
      mockRewardModel.create = jest.fn().mockResolvedValue({
        _id: 'reward1',
      });

      mockMappingModel.create = jest.fn();
      mockRewardLogModel.create = jest.fn();

      const dto = {
        rewardType: RewardType.CURRENCY,
        value: '500',
        quantity: 1,
        description: '보상 설명',
        eventId: 'event1',
      };

      const result = await service.createReward(dto, 'admin123');

      expect(result.message).toContain('성공');
      expect(mockMappingModel.create).toHaveBeenCalled();
      expect(mockRewardLogModel.create).toHaveBeenCalled();
    });
  });
});
