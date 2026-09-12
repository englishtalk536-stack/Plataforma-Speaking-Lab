import { PrismaClient, ItemType, NodeStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SpeakingLab database...');

  // --------------------------------------------------------------------
  // 1. Skill Tree Nodes
  // --------------------------------------------------------------------
  const basicGreetings = await prisma.skillNode.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Basic Greetings',
      description: 'Learn how to introduce yourself and greet others in everyday situations.',
      levelRequired: 1,
      parentNodeId: null,
      xpReward: 50,
      positionX: 0,
      positionY: 0,
    },
  });

  const orderingFood = await prisma.skillNode.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Ordering Food',
      description: 'Practice vocabulary and phrases used to order food at restaurants and cafés.',
      levelRequired: 2,
      parentNodeId: basicGreetings.id,
      xpReward: 75,
      positionX: 1,
      positionY: 0,
    },
  });

  const jobInterviewPrep = await prisma.skillNode.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'Job Interview Prep',
      description: 'Build confidence answering common job interview questions in English.',
      levelRequired: 5,
      parentNodeId: orderingFood.id,
      xpReward: 150,
      positionX: 2,
      positionY: 0,
    },
  });

  console.log(`✅ Skill nodes created: ${basicGreetings.title}, ${orderingFood.title}, ${jobInterviewPrep.title}`);

  // --------------------------------------------------------------------
  // 2. Badges
  // --------------------------------------------------------------------
  const firstStepBadge = await prisma.badge.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      title: 'First Step',
      description: 'Awarded for completing your very first lesson on SpeakingLab.',
      iconUrl: 'https://cdn.speakinglab.com/badges/first-step.svg',
      conditionType: 'LESSON_COMPLETED_COUNT',
      conditionValue: 1,
    },
  });

  const sevenDayStreakBadge = await prisma.badge.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      title: '7-Day Streak',
      description: 'Awarded for practicing seven days in a row without breaking your streak.',
      iconUrl: 'https://cdn.speakinglab.com/badges/7-day-streak.svg',
      conditionType: 'STREAK_LENGTH',
      conditionValue: 7,
    },
  });

  console.log(`✅ Badges created: ${firstStepBadge.title}, ${sevenDayStreakBadge.title}`);

  // --------------------------------------------------------------------
  // 3. Store Items
  // --------------------------------------------------------------------
  const streakFreezeItem = await prisma.storeItem.upsert({
    where: { id: '00000000-0000-0000-0000-000000000201' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000201',
      title: 'Streak Freeze',
      description: 'Protect your streak for one missed day.',
      costCoins: 100,
      itemType: ItemType.STREAK_FREEZE,
      imageUrl: 'https://cdn.speakinglab.com/store/streak-freeze.png',
      isActive: true,
    },
  });

  const classVoucherItem = await prisma.storeItem.upsert({
    where: { id: '00000000-0000-0000-0000-000000000202' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000202',
      title: '1-on-1 Class Voucher',
      description: 'Redeem for one private 45-minute class with a SpeakingLab teacher.',
      costCoins: 500,
      itemType: ItemType.LESSON_VOUCHER,
      imageUrl: 'https://cdn.speakinglab.com/store/class-voucher.png',
      isActive: true,
    },
  });

  console.log(`✅ Store items created: ${streakFreezeItem.title}, ${classVoucherItem.title}`);

  console.log('🌱 Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
