import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HOUSES = [
  "Stark",
  "Lannister",
  "Targaryen",
  "Baratheon",
  "Tyrell",
  "Martell",
  "Greyjoy",
  "Arryn",
  "Bolton",
  "Frey",
];

async function main() {
  for (const name of HOUSES) {
    await prisma.house.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  console.log(`Seeded ${HOUSES.length} houses.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
