import readline from 'readline';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { ENV } from '../config/env.js';

function askQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createFirstAdmin() {
  console.log(`\n======================================================`);
  console.log(`👤 Manikpur Eidgah First Admin Account Creator`);
  console.log(`======================================================`);

  try {
    const existingAdminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (existingAdminCount > 0) {
      console.log(`ℹ️  Notice: An ADMIN user already exists in the database.`);
      console.log(`To manage users, please log in through the admin panel.`);
      process.exit(0);
    }

    let name = '';
    let email = '';
    let password = '';

    const isInteractive = process.stdin.isTTY;

    if (isInteractive) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      name = (await askQuestion(rl, 'Enter Admin Name (e.g. প্রধান অ্যাডমিন): ')).trim();
      if (!name) name = ENV.ADMIN_BOOTSTRAP_NAME || 'প্রধান অ্যাডমিন';

      email = (await askQuestion(rl, 'Enter Admin Email: ')).trim().toLowerCase();
      while (!email || !email.includes('@')) {
        console.log('❌ Invalid email address.');
        email = (await askQuestion(rl, 'Enter Admin Email: ')).trim().toLowerCase();
      }

      password = (await askQuestion(rl, 'Enter Admin Password (min 10 characters): ')).trim();
      while (password.length < 10) {
        console.log('❌ Password must be at least 10 characters long.');
        password = (await askQuestion(rl, 'Enter Admin Password (min 10 characters): ')).trim();
      }

      rl.close();
    } else {
      // Non-interactive fallback (e.g. Docker / CI bootstrap)
      name = ENV.ADMIN_BOOTSTRAP_NAME || 'প্রধান অ্যাডমিন';
      email = (ENV.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
      password = ENV.ADMIN_BOOTSTRAP_PASSWORD || '';

      if (!email || !password || password.length < 10) {
        console.error('❌ In non-interactive mode, ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD (min 10 chars) must be provided.');
        process.exit(1);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        mustChangePassword: false,
      },
    });

    console.log(`\n✅ First ADMIN account successfully created!`);
    console.log(`Name:  ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role:  ${admin.role}`);
    console.log(`\nYou can now log in at: /${ENV.ADMIN_PATH}/login\n`);
  } catch (err) {
    console.error('❌ Failed to create admin user:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createFirstAdmin();

