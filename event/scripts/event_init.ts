import mongoose, { Types } from 'mongoose';
import { EventType } from 'src/event/common/event-type.enum';
import { ProgressStatus } from 'src/event/common/progress-status-type.enum';
import { RewardType } from 'src/event/dto/reward/create-reward.dto';
import { EventRewardMappingSchema } from 'src/event/schema/mapping/event-reward-mapping.schema';
import { EventSchema } from 'src/event/schema/event/event.schema';
import { RewardSchema } from 'src/event/schema/reward/reward.schema';
import { UserActionLogSchema } from 'src/event/schema/log/user-action-log.schema';
import { UserEventProgressSchema } from 'src/event/schema/event/user-event-progress.schema';

async function seed() {
  const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/event_db';
  await mongoose.connect(MONGO_URI);

  const EventModel = mongoose.model('Event', EventSchema);
  const RewardModel = mongoose.model('Reward', RewardSchema);
  const ActionLogModel = mongoose.model('UserActionLog', UserActionLogSchema);
  const UserEventProgressModel = mongoose.model(
    'UserEventProgress',
    UserEventProgressSchema,
  );
  const EventRewardMappingModel = mongoose.model(
    'EventRewardMapping',
    EventRewardMappingSchema,
  );
  const userIds = {
    user1: new Types.ObjectId('664000000000000000000065'),
    user2: new Types.ObjectId('664000000000000000000066'),
    user3: new Types.ObjectId('664000000000000000000064'),
  };
  const now = new Date();
  const twentyDaysLater = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
  // 1. 보상 생성
  const rewardsToInsert = [
    {
      _id: new Types.ObjectId('665000000000000000000001'),
      name: '출석 보상 1000P',
      rewardType: RewardType.POINT,
      value: 1000,
      quantity: 1,
      description: '5일 연속 로그인 보상',
    },
    {
      _id: new Types.ObjectId('665000000000000000000002'),
      name: '자쿰 킬 보상',
      rewardType: RewardType.ITEM,
      value: 1,
      quantity: 1,
      description: '자쿰 처치 시 지급',
    },
    {
      _id: new Types.ObjectId('665000000000000000000003'),
      name: '던전 클리어 보상',
      rewardType: RewardType.COUPON,
      value: 50,
      quantity: 1,
      description: '던전 클리어 시 50% 쿠폰',
    },
  ];

  const rewards: typeof rewardsToInsert = [];

  for (const reward of rewardsToInsert) {
    const exists = await RewardModel.exists({ _id: reward._id });
    if (!exists) {
      await RewardModel.create(reward);
    }
    rewards.push(reward);
  }

  const eventsToInsert = [
    {
      _id: new Types.ObjectId('666000000000000000000001'),
      title: '5일 연속 출석 이벤트',
      description: '5일 연속 로그인 시 보상을 지급합니다.',
      eventType: EventType.STREAK_LOGIN,
      condition: { requiredStreak: 5 },
      rewards: [rewards[0]._id],
      startDate: now,
      endDate: twentyDaysLater,
      isDeleted: false,
      isActive: true,
    },
    {
      _id: new Types.ObjectId('666000000000000000000002'),
      title: '자쿰 처치 이벤트',
      description: '자쿰을 처치하면 아이템을 지급합니다.',
      eventType: EventType.BOSS_KILL,
      condition: { bossId: 'ZAKUM' },
      rewards: [rewards[1]._id],
      startDate: now,
      endDate: twentyDaysLater,
      isDeleted: false,
      isActive: true,
    },
    {
      _id: new Types.ObjectId('666000000000000000000003'),
      title: '던전 클리어 이벤트',
      description: '던전 레벨 3 이상 클리어 시 보상을 지급합니다.',
      eventType: EventType.DUNGEON_CLEAR,
      condition: { requiredLevel: 3 },
      rewards: [rewards[2]._id],
      startDate: now,
      endDate: twentyDaysLater,
      isDeleted: false,
      isActive: true,
    },
  ];

  for (const event of eventsToInsert) {
    const exists = await EventModel.exists({ _id: event._id });
    if (!exists) {
      await EventModel.create(event);
    }
  }
  // 이벤트 보상 매핑테이블
  const eventRewardMappings = [
    {
      eventId: new Types.ObjectId('666000000000000000000001'),
      rewardId: new Types.ObjectId('665000000000000000000001'),
      isDeleted: false,
    },
    {
      eventId: new Types.ObjectId('666000000000000000000002'),
      rewardId: new Types.ObjectId('665000000000000000000002'),
      isDeleted: false,
    },
    {
      eventId: new Types.ObjectId('666000000000000000000003'),
      rewardId: new Types.ObjectId('665000000000000000000003'),
      isDeleted: false,
    },
  ];

  for (const mapping of eventRewardMappings) {
    const exists = await EventRewardMappingModel.exists({
      eventId: mapping.eventId,
      rewardId: mapping.rewardId,
      isDeleted: false,
    });
    if (!exists) {
      await EventRewardMappingModel.create(mapping);
    }
  }
  // 3. 유저 행동 로그 삽입
  await ActionLogModel.insertMany([
    {
      userId: userIds.user1,
      actionType: EventType.STREAK_LOGIN,
      metadata: { currentStreak: 5 },
      occurredAt: now,
    },
    {
      userId: userIds.user2,
      actionType: EventType.BOSS_KILL,
      metadata: { bossId: 'ZAKUM' },
      occurredAt: now,
    },
    {
      userId: userIds.user3,
      actionType: EventType.DUNGEON_CLEAR,
      metadata: { dungeonLevel: 3 },
      occurredAt: now,
    },
  ]);
  // 유저 퀘스트 진행 사항 기입
  await UserEventProgressModel.create([
    {
      userId: userIds.user1,
      eventId: new Types.ObjectId('666000000000000000000001'),
      progressStatus: ProgressStatus.COMPLETED,
      completedAt: now,
    },
    {
      userId: userIds.user2,
      eventId: new Types.ObjectId('666000000000000000000002'),
      progressStatus: ProgressStatus.COMPLETED,
      completedAt: now,
    },
    {
      userId: userIds.user3,
      eventId: new Types.ObjectId('666000000000000000000003'),
      progressStatus: ProgressStatus.COMPLETED,
      completedAt: now,
    },
  ]);

  await mongoose.disconnect();
  console.log('🌱 Event DB seeding complete.');
  process.exit();
}

seed().catch((err) => {
  console.error('❌ Event seed failed:', err);
  process.exit(1);
});
