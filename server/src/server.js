import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { startRetentionCleanup } from './services/retention/cleanupService.js';

const port = env.PORT;

try {
  let databaseConnected = false;
  try {
    databaseConnected = await connectDatabase();
  } catch (error) {
    if (env.NODE_ENV === 'production') throw error;
    process.stderr.write(`MongoDB is unavailable; API will start in degraded mode: ${error.message}\n`);
  }
  if (databaseConnected) startRetentionCleanup();
  app.listen(port, () => process.stdout.write(`AI Mystery Room API listening on port ${port}\n`));
} catch (error) {
  process.stderr.write(`Server startup failed: ${error.message}\n`);
  process.exitCode = 1;
}
