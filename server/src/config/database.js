import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.MONGODB_URI) return false;
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  return true;
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
