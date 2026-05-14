import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// the rest of your seed script remains the same
async function main() {
  // await prisma.animalType.createMany({
  //   data: [{ name: 'Ram' }, { name: 'Goat' }, { name: 'Cow' }],
  //   skipDuplicates: true,
  // });

  // await prisma.farm.createMany({
  //   data: [{
  //     name: 'Kaduna Livestock Farm',
  //     location: 'Kaduna, Nigeria',
  //   }],
  //   skipDuplicates: true,
  // });

  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@livestock.com' },
    update: {},
    create: {
      email: 'admin@livestock.com',
      password: hashedPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'Admin',
    },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
