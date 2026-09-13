import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const DEMO_TRYOUT_TOKEN = "cq-demo-photosynthesis";

function hashToken(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

const MATERIAL = `Photosynthesis converts light energy into chemical energy that plants can store and later use.

Chlorophyll pigments in the thylakoid membranes of chloroplasts absorb mainly blue and red wavelengths of light. Green light is largely reflected, which is why healthy leaves appear green.

The light-dependent reactions occur in the thylakoid membrane. Water molecules are split (photolysis), releasing oxygen as a byproduct. The same stage produces ATP and NADPH, which carry energy and reducing power to the next stage.

The Calvin cycle (light-independent reactions) takes place in the stroma. Rubisco fixes carbon dioxide onto ribulose bisphosphate. Through a series of enzyme-catalyzed steps, the cycle produces triose phosphate that can be used to build glucose and regenerate the CO2 acceptor.

Several environmental factors limit the rate of photosynthesis: light intensity, carbon dioxide concentration, and temperature. In a bimbel tryout, students should be able to map a factor to the stage it most directly affects — for example, light intensity on the light-dependent reactions, and CO2 concentration on carbon fixation.

Tutors should treat this note as source material only. Quiz items generated from it must stay faithful to these facts and must be approved before they appear on a timed tryout.`;

const QUESTIONS = [
  {
    id: "question_1",
    position: 0,
    stem: "According to the material, chlorophyll absorbs mainly which wavelengths of light?",
    options: ["Blue and red", "Green and yellow", "Only ultraviolet", "Infrared only"],
    correctIndex: 0,
    explanation: "Chlorophyll absorbs mainly blue and red wavelengths; green light is largely reflected.",
    sourceExcerpt: "Chlorophyll pigments in the thylakoid membranes of chloroplasts absorb mainly blue and red wavelengths of light.",
    difficulty: "easy",
    bloomTag: "remember",
  },
  {
    id: "question_2",
    position: 1,
    stem: "Where do the light-dependent reactions take place?",
    options: ["In the stroma", "In the thylakoid membrane", "In the nucleus", "In the mitochondrion"],
    correctIndex: 1,
    explanation: "The material locates the light-dependent reactions in the thylakoid membrane.",
    sourceExcerpt: "The light-dependent reactions occur in the thylakoid membrane.",
    difficulty: "easy",
    bloomTag: "remember",
  },
  {
    id: "question_3",
    position: 2,
    stem: "Photolysis of water during the light-dependent reactions releases which byproduct?",
    options: ["Nitrogen", "Methane", "Oxygen", "Glucose"],
    correctIndex: 2,
    explanation: "Water is split (photolysis), releasing oxygen as a byproduct.",
    sourceExcerpt: "Water molecules are split (photolysis), releasing oxygen as a byproduct.",
    difficulty: "easy",
    bloomTag: "understand",
  },
  {
    id: "question_4",
    position: 3,
    stem: "Which pair of products from the light-dependent reactions powers the Calvin cycle?",
    options: ["ATP and NADPH", "Oxygen and starch", "DNA and RNA", "Sodium and potassium"],
    correctIndex: 0,
    explanation: "ATP and NADPH carry energy and reducing power to the Calvin cycle.",
    sourceExcerpt: "The same stage produces ATP and NADPH, which carry energy and reducing power to the next stage.",
    difficulty: "medium",
    bloomTag: "understand",
  },
  {
    id: "question_5",
    position: 4,
    stem: "Carbon fixation in the Calvin cycle is catalyzed primarily by which enzyme named in the notes?",
    options: ["Amylase", "Helicase", "Pepsin", "Rubisco"],
    correctIndex: 3,
    explanation: "Rubisco fixes carbon dioxide onto ribulose bisphosphate in the stroma.",
    sourceExcerpt: "Rubisco fixes carbon dioxide onto ribulose bisphosphate.",
    difficulty: "medium",
    bloomTag: "remember",
  },
  {
    id: "question_6",
    position: 5,
    stem: "Where does the Calvin cycle take place?",
    options: ["Thylakoid lumen", "Stroma", "Cytoplasm of animal cells", "Cell wall"],
    correctIndex: 1,
    explanation: "The Calvin cycle (light-independent reactions) takes place in the stroma.",
    sourceExcerpt: "The Calvin cycle (light-independent reactions) takes place in the stroma.",
    difficulty: "easy",
    bloomTag: "remember",
  },
  {
    id: "question_7",
    position: 6,
    stem: "Which environmental factor most directly limits carbon fixation according to the material?",
    options: ["Carbon dioxide concentration", "Soil color", "Moon phase", "Loud classroom noise"],
    correctIndex: 0,
    explanation: "The notes list CO2 concentration as a limiter and map it to carbon fixation.",
    sourceExcerpt: "carbon dioxide concentration, and temperature. In a bimbel tryout, students should be able to map a factor to the stage it most directly affects — for example, light intensity on the light-dependent reactions, and CO2 concentration on carbon fixation.",
    difficulty: "medium",
    bloomTag: "apply",
  },
  {
    id: "question_8",
    position: 7,
    stem: "Light intensity most directly affects which stage named in the notes?",
    options: ["Carbon fixation only", "The light-dependent reactions", "DNA replication", "Protein folding in the nucleus"],
    correctIndex: 1,
    explanation: "The notes map light intensity onto the light-dependent reactions.",
    sourceExcerpt: "light intensity on the light-dependent reactions, and CO2 concentration on carbon fixation.",
    difficulty: "medium",
    bloomTag: "apply",
  },
  {
    id: "question_9",
    position: 8,
    stem: "Why do healthy leaves appear green, according to the material?",
    options: [
      "They emit green light from ATP",
      "Green light is largely reflected",
      "Rubisco is green",
      "Stroma stores green pigment only",
    ],
    correctIndex: 1,
    explanation: "Green light is largely reflected, which is why healthy leaves appear green.",
    sourceExcerpt: "Green light is largely reflected, which is why healthy leaves appear green.",
    difficulty: "easy",
    bloomTag: "understand",
  },
  {
    id: "question_10",
    position: 9,
    stem: "Triose phosphate produced by the Calvin cycle can be used to do which of the following?",
    options: [
      "Split water in the thylakoid",
      "Build glucose and regenerate the CO2 acceptor",
      "Absorb ultraviolet light only",
      "Replace chlorophyll with starch",
    ],
    correctIndex: 1,
    explanation: "Triose phosphate can be used to build glucose and regenerate the CO2 acceptor.",
    sourceExcerpt:
      "the cycle produces triose phosphate that can be used to build glucose and regenerate the CO2 acceptor.",
    difficulty: "hard",
    bloomTag: "analyze",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("Demo123!", 10);

  const tutor = await prisma.user.upsert({
    where: { email: "demo@cohortquiz.dev" },
    update: { passwordHash, name: "Dewi Tutor" },
    create: {
      id: "user_tutor_demo",
      email: "demo@cohortquiz.dev",
      passwordHash,
      name: "Dewi Tutor",
    },
  });

  const material = await prisma.material.upsert({
    where: { id: "material_photosynthesis" },
    update: {
      title: "Intro to Photosynthesis",
      subject: "SMA IPA",
      bodyText: MATERIAL,
      userId: tutor.id,
      archivedAt: null,
    },
    create: {
      id: "material_photosynthesis",
      title: "Intro to Photosynthesis",
      subject: "SMA IPA",
      bodyText: MATERIAL,
      userId: tutor.id,
    },
  });

  const quiz = await prisma.quiz.upsert({
    where: { id: "quiz_photosynthesis" },
    update: {
      userId: tutor.id,
      materialId: material.id,
      title: "Photosynthesis MCQ tryout",
      status: "approved",
      itemCount: QUESTIONS.length,
      model: "seed",
      promptVersion: "v1",
    },
    create: {
      id: "quiz_photosynthesis",
      userId: tutor.id,
      materialId: material.id,
      title: "Photosynthesis MCQ tryout",
      status: "approved",
      itemCount: QUESTIONS.length,
      model: "seed",
      promptVersion: "v1",
    },
  });

  for (const q of QUESTIONS) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        quizId: quiz.id,
        position: q.position,
        stem: q.stem,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        sourceExcerpt: q.sourceExcerpt,
        difficulty: q.difficulty,
        bloomTag: q.bloomTag,
      },
      create: {
        id: q.id,
        quizId: quiz.id,
        position: q.position,
        stem: q.stem,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        sourceExcerpt: q.sourceExcerpt,
        difficulty: q.difficulty,
        bloomTag: q.bloomTag,
      },
    });
  }

  const tryout = await prisma.tryout.upsert({
    where: { id: "tryout_demo" },
    update: {
      quizId: quiz.id,
      token: DEMO_TRYOUT_TOKEN,
      tokenHash: hashToken(DEMO_TRYOUT_TOKEN),
      durationSeconds: 15 * 60,
      isActive: true,
    },
    create: {
      id: "tryout_demo",
      quizId: quiz.id,
      token: DEMO_TRYOUT_TOKEN,
      tokenHash: hashToken(DEMO_TRYOUT_TOKEN),
      durationSeconds: 15 * 60,
      isActive: true,
    },
  });

  await prisma.attemptAnswer.deleteMany({ where: { attemptId: "attempt_demo_andi" } });
  await prisma.attempt.upsert({
    where: { id: "attempt_demo_andi" },
    update: {
      tryoutId: tryout.id,
      studentLabel: "Andi",
      submittedAt: new Date(),
      scoreCorrect: 9,
      scoreTotal: 10,
      percent: 90,
      timedOut: false,
    },
    create: {
      id: "attempt_demo_andi",
      tryoutId: tryout.id,
      studentLabel: "Andi",
      submittedAt: new Date(),
      scoreCorrect: 9,
      scoreTotal: 10,
      percent: 90,
      timedOut: false,
    },
  });

  const andiAnswers = QUESTIONS.map((q, i) => ({
    id: `answer_andi_${i + 1}`,
    attemptId: "attempt_demo_andi",
    questionId: q.id,
    selectedIndex: i === 3 ? 1 : q.correctIndex,
    isCorrect: i !== 3,
  }));

  await prisma.attemptAnswer.createMany({ data: andiAnswers });

  await prisma.attempt.upsert({
    where: { id: "attempt_demo_siti" },
    update: {
      tryoutId: tryout.id,
      studentLabel: "Siti",
      submittedAt: null,
      scoreCorrect: null,
      scoreTotal: null,
      percent: null,
      timedOut: false,
    },
    create: {
      id: "attempt_demo_siti",
      tryoutId: tryout.id,
      studentLabel: "Siti",
      submittedAt: null,
      scoreCorrect: null,
      scoreTotal: null,
      percent: null,
      timedOut: false,
    },
  });

  console.log("Seeded  demo@cohortquiz.dev / Demo123!");
  console.log(`Sample tryout: /t/${DEMO_TRYOUT_TOKEN}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
