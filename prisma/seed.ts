import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPasswordDefault = await bcrypt.hash('ChangeMe123', 10);
  const hashedPasswordMaster = await bcrypt.hash('Abc123..', 10);

  const users: Array<{
    email: string;
    password: string;
    name: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: Role;
    active: boolean;
  }> = [
    {
      email: 'sam94c@gmail.com',
      password: hashedPasswordMaster,
      name: 'Master Admin',
      firstName: 'Master',
      lastName: 'Admin',
      phoneNumber: '+1234567890',
      role: Role.ADMIN,
      active: true,
    },
    {
      email: 'admin@test.com',
      password: hashedPasswordDefault,
      name: 'Admin Test',
      firstName: 'Admin',
      lastName: 'Test',
      phoneNumber: '+1000000001',
      role: Role.ADMIN,
      active: true,
    },
    {
      email: 'cajero@test.com',
      password: hashedPasswordDefault,
      name: 'Cajero Test',
      firstName: 'Cajero',
      lastName: 'Test',
      phoneNumber: '+1000000002',
      role: Role.CASHIER,
      active: true,
    },
    {
      email: 'cocina@test.com',
      password: hashedPasswordDefault,
      name: 'Cocina Test',
      firstName: 'Cocina',
      lastName: 'Test',
      phoneNumber: '+1000000003',
      role: Role.KITCHEN,
      active: true,
    },
    {
      email: 'mesero@test.com',
      password: hashedPasswordDefault,
      name: 'Mesero Test',
      firstName: 'Mesero',
      lastName: 'Test',
      phoneNumber: '+1000000004',
      role: Role.WAITRESS,
      active: true,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        active: userData.active,
      },
      create: userData,
    });
    console.log(`User upserted: ${user.email} (${user.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
