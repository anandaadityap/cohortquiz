import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MATERIAL = `Photosynthesis converts light energy into chemical energy that plants can store and later use.

Chlorophyll pigments in the thylakoid membranes of chloroplasts absorb mainly blue and red wavelengths of light. Green light is largely reflected, which is why healthy leaves appear green.

The light-dependent reactions occur in the thylakoid membrane. Water molecules are split (photolysis), releasing oxygen as a byproduct. The same stage produces ATP and NADPH, which carry energy and reducing power to the next stage.

The Calvin cycle (light-independent reactions) takes place in the stroma. Rubisco fixes carbon dioxide onto ribulose bisphosphate. Through a series of enzyme-catalyzed steps, the cycle produces triose phosphate that can be used to build glucose and regenerate the CO2 acceptor.

Several environmental factors limit the rate of photosynthesis: light intensity, carbon dioxide concentration, and temperature. In a bimbel tryout, students should be able to map a factor to the stage it most directly affects — for example, light intensity on the light-dependent reactions, and CO2 concentration on carbon fixation.

Tutors should treat this note as source material only. Quiz items generated from it must stay faithful to these facts and must be approved before they appear on a timed tryout.`;

const options = (list) => list;

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const tutor = await prisma.user.upsert({
    where: { email: "tutor@cohortquiz.demo" },
    update: { passwordHash, name: "Dewi Tutor", role: "TUTOR" },
    create: {
      id: "user_tutor_demo",
      email: "tutor@cohortquiz.demo",
      passwordHash,
      name: "Dewi Tutor",
      role: "TUTOR",
    },
  });

  const material = await prisma.material.upsert({
    where: { id: "material_photosynthesis" },
    update: { title: "Photosynthesis for SMA IPA", content: MATERIAL, authorId: tutor.id },
    create: {
      id: "material_photosynthesis",
      title: "Photosynthesis for SMA IPA",
      content: MATERIAL,
      authorId: tutor.id,
    },
  });

  const questions = [
    {
      id: "question_approved_1",
      status: "APPROVED",
      stem: "According to the material, chlorophyll absorbs mainly which wavelengths of light?",
      options: options(["Blue and red", "Green and yellow", "Only ultraviolet", "Infrared only"]),
      correctIndex: 0,
      explanation:
        "The notes state that chlorophyll absorbs mainly blue and red wavelengths; green light is largely reflected.",
    },
    {
      id: "question_approved_2",
      status: "APPROVED",
      stem: "Where do the light-dependent reactions take place?",
      options: options(["In the stroma", "In the thylakoid membrane", "In the nucleus", "In the mitochondrion"]),
      correctIndex: 1,
      explanation: "The material locates the light-dependent reactions in the thylakoid membrane.",
    },
    {
      id: "question_approved_3",
      status: "APPROVED",
      stem: "Photolysis of water during the light-dependent reactions releases which byproduct?",
      options: options(["Nitrogen", "Methane", "Oxygen", "Glucose"]),
      correctIndex: 2,
      explanation: "Water is split (photolysis), releasing oxygen as a byproduct.",
    },
    {
      id: "question_approved_4",
      status: "APPROVED",
      stem: "Which pair of products from the light-dependent reactions powers the Calvin cycle?",
      options: options(["ATP and NADPH", "Oxygen and starch", "DNA and RNA", "Sodium and potassium"]),
      correctIndex: 0,
      explanation: "ATP and NADPH carry energy and reducing power to the Calvin cycle.",
    },
    {
      id: "question_approved_5",
      status: "APPROVED",
      stem: "Carbon fixation in the Calvin cycle is catalyzed primarily by which enzyme named in the notes?",
      options: options(["Amylase", "Helicase", "Pepsin", "Rubisco"]),
      correctIndex: 3,
      explanation: "Rubisco fixes carbon dioxide onto ribulose bisphosphate in the stroma.",
    },
    {
      id: "question_draft_1",
      status: "DRAFT",
      stem: "Which environmental factor most directly limits carbon fixation according to the material?",
      options: options([
        "Carbon dioxide concentration",
        "Soil color",
        "Moon phase",
        "Loud classroom noise",
      ]),
      correctIndex: 0,
      explanation:
        "The notes list CO2 concentration as a limiter and map it to carbon fixation. This item is still a draft until a tutor approves it.",
    },
  ];

  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        materialId: material.id,
        stem: q.stem,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        status: q.status,
        source: "seed",
      },
      create: {
        id: q.id,
        materialId: material.id,
        stem: q.stem,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        status: q.status,
        source: "seed",
      },
    });
  }

  const tryout = await prisma.tryout.upsert({
    where: { id: "tryout_demo" },
    update: {
      materialId: material.id,
      title: "SMA IPA — Photosynthesis mini tryout",
      token: "demo-tryout",
      durationMinutes: 12,
      createdById: tutor.id,
    },
    create: {
      id: "tryout_demo",
      materialId: material.id,
      title: "SMA IPA — Photosynthesis mini tryout",
      token: "demo-tryout",
      durationMinutes: 12,
      createdById: tutor.id,
    },
  });

  await prisma.tryoutQuestion.deleteMany({ where: { tryoutId: tryout.id } });
  const approved = questions.filter((q) => q.status === "APPROVED");
  await prisma.tryoutQuestion.createMany({
    data: approved.map((q, index) => ({
      tryoutId: tryout.id,
      questionId: q.id,
      position: index,
    })),
  });

  await prisma.attempt.upsert({
    where: { id: "attempt_demo_rina" },
    update: {
      tryoutId: tryout.id,
      displayName: "Rina",
      submittedAt: new Date(),
      answers: {
        question_approved_1: 0,
        question_approved_2: 1,
        question_approved_3: 2,
        question_approved_4: 1,
        question_approved_5: 3,
      },
      score: 4,
      total: 5,
      percentage: 80,
      late: false,
    },
    create: {
      id: "attempt_demo_rina",
      tryoutId: tryout.id,
      displayName: "Rina",
      submittedAt: new Date(),
      answers: {
        question_approved_1: 0,
        question_approved_2: 1,
        question_approved_3: 2,
        question_approved_4: 1,
        question_approved_5: 3,
      },
      score: 4,
      total: 5,
      percentage: 80,
      late: false,
    },
  });

  console.log("Seeded tutor@cohortquiz.demo / demo1234");
  console.log("Sample tryout token: demo-tryout");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
