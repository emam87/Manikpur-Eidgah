import { ENV } from '../config/env.js';
import { getValidatedAdminPath } from '../utils/adminPath.js';

try {
  const adminPath = getValidatedAdminPath(ENV.ADMIN_PATH);
  const clientUrl = ENV.CLIENT_URL.replace(/\/$/, '');
  const fullAdminUrl = `${clientUrl}/${adminPath}`;

  console.log(`\n======================================================`);
  console.log(`🔑 Manikpur Eidgah Admin URL Configuration`);
  console.log(`======================================================`);
  console.log(`Configured Secret Admin Path: /${adminPath}`);
  console.log(`Direct Admin Login URL:       ${fullAdminUrl}/login`);
  console.log(`Direct Admin Dashboard URL:   ${fullAdminUrl}`);
  console.log(`\n⚠️  Note: Decoy paths (/admin, /login, /dashboard, etc.) return a standard 404.`);
  console.log(`======================================================\n`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

