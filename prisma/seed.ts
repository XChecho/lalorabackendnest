import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'sam94c@gmail.com';

  const hashedPassword = await bcrypt.hash('Abc123..', 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        firstName: existingUser.firstName || 'Master',
        lastName: existingUser.lastName || 'Admin',
      },
    });
    console.log('Master user updated');
    return;
  }

  const masterUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Master Admin',
      firstName: 'Master',
      lastName: 'Admin',
      phoneNumber: '+1234567890',
      role: 'ADMIN',
      active: true,
    },
  });

  console.log('Master user created:', masterUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
