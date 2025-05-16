import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Event } from './schema/event.schema';
import { Reward } from './schema/reward.schema';
import { EventRewardMapping } from './schema/event-reward-mapping.schema';
import { EventAdminLog } from './schema/event-admin-log.schema';
import { RewardAdminLog } from './schema/reward-admin-log.schema';

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
});
