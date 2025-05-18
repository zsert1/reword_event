import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Event } from './schema/event/event.schema';
import { Reward } from './schema/reward/reward.schema';
import { EventRewardMapping } from './schema/mapping/event-reward-mapping.schema';
import { EventAdminLog } from './schema/event/event-admin-log.schema';
import { RewardAdminLog } from './schema/log/reward-admin-log.schema';

describe('EventService', () => {
  let service: EventService;
  let mockEventModel: any;
  let mockRewardModel: any;
  let mockMappingModel: any;
  let mockEventLogModel: any;
  let mockRewardLogModel: any;
  let mockConnection: any;
  let mockSession: any;
  const createdMappings = [];
  beforeEach(async () => {
    createdMappings.length = 0;
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    mockConnection = {
      startSession: jest.fn().mockResolvedValue(mockSession),
    };

    mockEventModel = jest.fn().mockImplementation((dto) => {
      return {
        _id: 'event1', // ✅ 여기에 직접 추가
        save: jest.fn().mockResolvedValue({
          _id: 'event1',
          ...dto,
        }),
      };
    });

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
});
