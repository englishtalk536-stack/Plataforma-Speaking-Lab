import { PrismaClient, ItemType, NodeStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SpeakingLab database...');

  const localUser = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      email: 'student@localhost.test',
      fullName: 'Local SpeakingLab Student',
      level: 3,
      currentXp: 240,
      coins: 180,
      radarFluency: 68,
      radarGrammar: 62,
      radarPronunciation: 74,
      radarVocabulary: 71,
    },
  });

  await prisma.streak.upsert({
    where: { userId: localUser.id },
    update: {},
    create: {
      userId: localUser.id,
      currentStreak: 4,
      maxStreak: 7,
      lastActivityDate: new Date(),
      freezeCredits: 1,
    },
  });

  // --------------------------------------------------------------------
  // 1. Skill Tree Nodes
  // --------------------------------------------------------------------
  const basicGreetings = await prisma.skillNode.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: { coinReward: 10 },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Basic Greetings',
      description: 'Learn how to introduce yourself and greet others in everyday situations.',
      levelRequired: 1,
      parentNodeId: null,
      xpReward: 50,
      coinReward: 10,
      positionX: 0,
      positionY: 0,
    },
  });

  const orderingFood = await prisma.skillNode.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: { coinReward: 15 },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Ordering Food',
      description: 'Practice vocabulary and phrases used to order food at restaurants and cafés.',
      levelRequired: 2,
      parentNodeId: basicGreetings.id,
      xpReward: 75,
      coinReward: 15,
      positionX: 1,
      positionY: 0,
    },
  });

  const jobInterviewPrep = await prisma.skillNode.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: { coinReward: 25 },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'Job Interview Prep',
      description: 'Build confidence answering common job interview questions in English.',
      levelRequired: 5,
      parentNodeId: orderingFood.id,
      xpReward: 150,
      coinReward: 25,
      positionX: 2,
      positionY: 0,
    },
  });

  console.log(`✅ Skill nodes created: ${basicGreetings.title}, ${orderingFood.title}, ${jobInterviewPrep.title}`);

  const travelStories = await prisma.skillNode.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: { title: 'Travel Stories', coinReward: 30 },
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      title: 'Travel Stories',
      description: 'Tell engaging stories about trips, mishaps, and memorable places.',
      levelRequired: 8,
      parentNodeId: jobInterviewPrep.id,
      xpReward: 200,
      coinReward: 30,
      positionX: 3,
      positionY: 0,
    },
  });
  const businessNegotiation = await prisma.skillNode.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: { title: 'Business Negotiation', coinReward: 40 },
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      title: 'Business Negotiation',
      description: 'Negotiate terms, make concessions, and defend your priorities clearly.',
      levelRequired: 12,
      parentNodeId: travelStories.id,
      xpReward: 275,
      coinReward: 40,
      positionX: 4,
      positionY: 0,
    },
  });
  const abstractDebate = await prisma.skillNode.upsert({
    where: { id: '00000000-0000-0000-0000-000000000006' },
    update: { title: 'Abstract Debate', coinReward: 50 },
    create: {
      id: '00000000-0000-0000-0000-000000000006',
      title: 'Abstract Debate',
      description: 'Debate complex ideas with nuance, evidence, and precise transitions.',
      levelRequired: 16,
      parentNodeId: businessNegotiation.id,
      xpReward: 350,
      coinReward: 50,
      positionX: 5,
      positionY: 0,
    },
  });

  console.log(`✅ Extended skill path: ${travelStories.title}, ${businessNegotiation.title}, ${abstractDebate.title}`);

  await prisma.userSkillProgress.upsert({
    where: { userId_nodeId: { userId: localUser.id, nodeId: basicGreetings.id } },
    update: { status: NodeStatus.COMPLETED },
    create: { userId: localUser.id, nodeId: basicGreetings.id, status: NodeStatus.COMPLETED },
  });
  await prisma.userSkillProgress.upsert({
    where: { userId_nodeId: { userId: localUser.id, nodeId: travelStories.id } },
    update: { status: NodeStatus.LOCKED },
    create: { userId: localUser.id, nodeId: travelStories.id, status: NodeStatus.LOCKED },
  });
  await prisma.userSkillProgress.upsert({
    where: { userId_nodeId: { userId: localUser.id, nodeId: businessNegotiation.id } },
    update: { status: NodeStatus.LOCKED },
    create: { userId: localUser.id, nodeId: businessNegotiation.id, status: NodeStatus.LOCKED },
  });
  await prisma.userSkillProgress.upsert({
    where: { userId_nodeId: { userId: localUser.id, nodeId: abstractDebate.id } },
    update: { status: NodeStatus.LOCKED },
    create: { userId: localUser.id, nodeId: abstractDebate.id, status: NodeStatus.LOCKED },
  });
  await prisma.userSkillProgress.upsert({
    where: { userId_nodeId: { userId: localUser.id, nodeId: orderingFood.id } },
    update: { status: NodeStatus.UNLOCKED },
    create: { userId: localUser.id, nodeId: orderingFood.id, status: NodeStatus.UNLOCKED },
  });
  await prisma.userSkillProgress.upsert({
    where: { userId_nodeId: { userId: localUser.id, nodeId: jobInterviewPrep.id } },
    update: { status: NodeStatus.LOCKED },
    create: { userId: localUser.id, nodeId: jobInterviewPrep.id, status: NodeStatus.LOCKED },
  });

  const questCatalog = [
    {
      id: '00000000-0000-0000-0000-000000000301',
      title: 'Daily Voice Warm-up',
      description: 'Speak for two minutes about your morning routine.',
      xpReward: 30,
      coinReward: 15,
      scenarioType: 'FREE_TALK' as const,
    },
    {
      id: '00000000-0000-0000-0000-000000000302',
      title: 'Order with Confidence',
      description: 'Practice ordering a meal naturally in English.',
      xpReward: 45,
      coinReward: 20,
      scenarioType: 'ROLEPLAY_CAFE' as const,
    },
  ];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (const questData of questCatalog) {
    const quest = await prisma.dailyQuest.upsert({
      where: { id: questData.id },
      update: questData,
      create: questData,
    });
    await prisma.userDailyQuest.upsert({
      where: {
        userId_questId_assignedDate: {
          userId: localUser.id,
          questId: quest.id,
          assignedDate: today,
        },
      },
      update: {},
      create: { userId: localUser.id, questId: quest.id, assignedDate: today },
    });
  }
  console.log(`✅ Local user and ${questCatalog.length} daily quests ready: ${localUser.email}`);

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
