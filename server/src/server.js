import { app } from './app.js';
import { ENV } from './config/env.js';
import { getValidatedAdminPath } from './utils/adminPath.js';

const PORT = ENV.PORT || 5000;

try {
  // Validate secret admin path on startup
  const validAdminPath = getValidatedAdminPath(ENV.ADMIN_PATH);

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🕌 Manikpur Central Shahi Eidgah REST API`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🔒 Secret Admin Path: /${validAdminPath}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`⚙️  Environment: ${ENV.NODE_ENV}`);
    console.log(`======================================================\n`);
  });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

