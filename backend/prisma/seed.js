const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Validate ADMIN_PASSWORD presence
  if (!process.env.ADMIN_PASSWORD) {
    console.error('\n❌ ADMIN_PASSWORD environment variable is missing.\n');
    console.error('Please set:\n');
    console.error('  ADMIN_PASSWORD=your-secure-password\n');
    console.error('before running:\n');
    console.error('  npx prisma db seed\n');
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@rajmobileandelectrics.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  console.log('🌱 Seeding Raj Mobile & Electrics database...');
  console.log(`📌 Admin Email configured: ${adminEmail}`);

  // Hash the admin password
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Upsert the Admin User
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: passwordHash,
      role: 'ADMIN',
      isVerified: true,
    },
    create: {
      firstName: 'Admin',
      lastName: 'Store',
      email: adminEmail,
      password: passwordHash,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  console.log(`✅ Production Admin user created: ${admin.email}`);
  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
