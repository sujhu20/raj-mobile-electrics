const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables if .env file exists
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const usersPath = path.join(__dirname, 'users.json');
  console.log(`🌱 Loading users seed data from: ${usersPath}`);
  
  if (!fs.existsSync(usersPath)) {
    console.error('❌ users.json file not found!');
    process.exit(1);
  }

  const rawData = fs.readFileSync(usersPath, 'utf8');
  const usersToSeed = JSON.parse(rawData);

  console.log(`🌱 Found ${usersToSeed.length} users to seed. Starting upsert...`);

  for (const userData of usersToSeed) {
    const { email, password, firstName, lastName, role, phone, isVerified } = userData;
    console.log(`👉 Seeding user: ${email} (${role})`);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Upsert the User
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        password: hashedPassword,
        role,
        phone,
        isVerified,
      },
      create: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        phone,
        isVerified,
      },
    });

    // Create an empty cart for the user if it doesn't exist
    const existingCart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!existingCart) {
      await prisma.cart.create({
        data: { userId: user.id },
      });
      console.log(`   🛒 Created empty cart for user: ${email}`);
    } else {
      console.log(`   🛒 User already has a cart.`);
    }

    console.log(`   ✅ User seeded: ${user.email} (ID: ${user.id})`);
  }

  console.log('\n🎉 Seeding users complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding users failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
