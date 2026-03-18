import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL || '');

export async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not configured. Skipping database initialization.");
    return;
  }

  try {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT,
        role TEXT DEFAULT 'client',
        status TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        "serviceType" TEXT,
        "estimatedDuration" TEXT,
        priority TEXT,
        status TEXT DEFAULT 'pending',
        "clientUid" TEXT REFERENCES users(uid),
        "engineerUid" TEXT REFERENCES users(uid),
        description TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        "senderId" TEXT REFERENCES users(uid),
        "receiverId" TEXT REFERENCES users(uid),
        text TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        type TEXT,
        "userUid" TEXT REFERENCES users(uid),
        description TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS quotations (
        id TEXT PRIMARY KEY,
        "ticketId" TEXT REFERENCES tickets(id),
        amount NUMERIC,
        status TEXT DEFAULT 'pending',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS presence (
        uid TEXT PRIMARY KEY REFERENCES users(uid),
        status TEXT,
        "lastSeen" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS typing (
        id TEXT PRIMARY KEY,
        "isTyping" BOOLEAN,
        "userUid" TEXT REFERENCES users(uid)
      );
    `;

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

export default sql;
