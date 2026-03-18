import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import fs from "fs";
import { Server } from "socket.io";
import { createServer } from "http";
import { v4 as uuidv4 } from "uuid";

import { neon } from "@neondatabase/serverless";

dotenv.config();

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "logistmate@gmail.com";
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || "desklink2026";

// Initialize Neon Tables
const initNeon = async () => {
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        role TEXT DEFAULT 'client',
        name TEXT,
        status TEXT DEFAULT 'Active',
        "companyName" TEXT,
        "firstName" TEXT,
        "lastName" TEXT,
        country TEXT,
        city TEXT,
        "companySize" TEXT,
        specialization TEXT,
        experience TEXT,
        "hourlyRate" TEXT,
        "halfDayRate" TEXT,
        "fullDayRate" TEXT,
        skills JSONB,
        languages JSONB,
        "phoneNumber" TEXT,
        "phoneCountryCode" TEXT,
        "whatsappNumber" TEXT,
        "whatsappCountryCode" TEXT,
        "profilePic" TEXT,
        "cvFile" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "lastLogin" TIMESTAMP WITH TIME ZONE
      )
    `;
    
    // Add missing columns if table already exists
    const columns = [
      { name: 'companyName', type: 'TEXT' },
      { name: 'firstName', type: 'TEXT' },
      { name: 'lastName', type: 'TEXT' },
      { name: 'country', type: 'TEXT' },
      { name: 'city', type: 'TEXT' },
      { name: 'companySize', type: 'TEXT' },
      { name: 'specialization', type: 'TEXT' },
      { name: 'experience', type: 'TEXT' },
      { name: 'hourlyRate', type: 'TEXT' },
      { name: 'halfDayRate', type: 'TEXT' },
      { name: 'fullDayRate', type: 'TEXT' },
      { name: 'skills', type: 'JSONB' },
      { name: 'languages', type: 'JSONB' },
      { name: 'phoneNumber', type: 'TEXT' },
      { name: 'phoneCountryCode', type: 'TEXT' },
      { name: 'whatsappNumber', type: 'TEXT' },
      { name: 'whatsappCountryCode', type: 'TEXT' },
      { name: 'profilePic', type: 'TEXT' },
      { name: 'cvFile', type: 'TEXT' }
    ];

    for (const col of columns) {
      try {
        // Use string interpolation for column name and type as neon template literal 
        // doesn't support parameterizing identifiers/keywords.
        // These values are hardcoded in the 'columns' array above.
        await (sql as any)(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
      } catch (err) {
        console.error(`Error adding column ${col.name}:`, err);
      }
    }
    await sql`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        status TEXT DEFAULT 'Open',
        priority TEXT DEFAULT 'Medium',
        category TEXT,
        client TEXT,
        engineer TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        "ticketId" TEXT,
        sender TEXT,
        text TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        type TEXT
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        "user" TEXT,
        action TEXT,
        target TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS quotations (
        id TEXT PRIMARY KEY,
        "ticketId" TEXT,
        amount NUMERIC,
        status TEXT DEFAULT 'Pending',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        "userId" TEXT,
        type TEXT,
        title TEXT,
        message TEXT,
        read BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        "ticketId" TEXT,
        amount NUMERIC,
        status TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        author TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS presence (
        uid TEXT PRIMARY KEY,
        status TEXT,
        "lastSeen" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS typing (
        id TEXT PRIMARY KEY,
        "isTyping" BOOLEAN,
        "userUid" TEXT
      )
    `;
    console.log("Neon tables initialized successfully");
  } catch (error) {
    console.error("Error initializing Neon tables:", error);
  }
};

await initNeon();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  next();
});

// Simple JSON Database
const DB_PATH = path.join(__dirname, "db.json");
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({
    users: [],
    tickets: [],
    messages: [],
    activities: [],
    quotations: [],
    notifications: [],
    invoices: [],
    jobs: [],
    posts: [],
    presence: {},
    typing: {}
  }));
}

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
const writeDB = (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/send-email", async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not configured. Skipping email send.");
    return res.status(200).json({ success: true, message: "Email skipped (not configured)" });
  }

  try {
    await transporter.sendMail({
      from: `"DeskLink Notifications" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

// Auth API
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, role, uid: clientUid, name, ...rest } = req.body;
  const uid = clientUid || uuidv4();

  if (sql) {
    try {
      let existing;
      try {
        existing = await sql`SELECT * FROM users WHERE email = ${email}`;
      } catch (dbErr: any) {
        console.error("Database query error during signup check:", dbErr);
        return res.status(500).json({ error: `Database error: ${dbErr.message || "Connection failed"}` });
      }

      if (existing.length > 0) {
        // If it's the admin email and master password, just return the existing user
        if (email === ADMIN_EMAIL && password === MASTER_PASSWORD) {
          return res.json({ user: existing[0] });
        }
        return res.status(400).json({ error: "User already exists" });
      }

      const [newUser] = await sql`
        INSERT INTO users (
          uid, email, password, role, name, status,
          "companyName", "firstName", "lastName", country, city, "companySize",
          specialization, experience, "hourlyRate", "halfDayRate", "fullDayRate",
          skills, languages, "phoneNumber", "phoneCountryCode", "whatsappNumber",
          "whatsappCountryCode", "profilePic", "cvFile"
        )
        VALUES (
          ${uid}, ${email}, ${password}, ${role || 'client'}, ${name || rest.name || ''}, 'Active',
          ${rest.companyName || null}, ${rest.firstName || null}, ${rest.lastName || null},
          ${rest.country || null}, ${rest.city || null}, ${rest.companySize || null},
          ${rest.specialization || null}, ${rest.experience || null}, ${rest.hourlyRate || null},
          ${rest.halfDayRate || null}, ${rest.fullDayRate || null},
          ${rest.skills ? JSON.stringify(rest.skills) : null},
          ${rest.languages ? JSON.stringify(rest.languages) : null},
          ${rest.phoneNumber || null}, ${rest.phoneCountryCode || null},
          ${rest.whatsappNumber || null}, ${rest.whatsappCountryCode || null},
          ${rest.profilePic || null}, ${rest.cvFile || null}
        )
        RETURNING *
      `;
      return res.json({ user: newUser });
    } catch (error: any) {
      console.error("Signup error in Neon:", error);
      return res.status(500).json({ error: error.message || "Database error during signup" });
    }
  }

  const db = readDB();
  const existingUser = db.users.find((u: any) => u.email === email);
  if (existingUser) {
    if (email === ADMIN_EMAIL && password === MASTER_PASSWORD) {
      return res.json({ user: existingUser });
    }
    return res.status(400).json({ error: "User already exists" });
  }
  const newUser = { 
    ...rest, 
    email, 
    role: role || 'client', 
    uid, 
    createdAt: new Date().toISOString() 
  };
  db.users.push(newUser);
  writeDB(db);
  res.json({ user: newUser });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (sql) {
    try {
      const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
      // Special case for admin master password: it must be the ONLY way to login as admin
      const isAdminEmail = email === ADMIN_EMAIL;
      const isMasterPassword = password === MASTER_PASSWORD;
      
      if (user && (isAdminEmail ? isMasterPassword : user.password === password)) {
        await sql`UPDATE users SET "lastLogin" = CURRENT_TIMESTAMP WHERE uid = ${user.uid}`;
        return res.json({ user });
      } else {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error: any) {
      console.error("Login error in Neon:", error);
      return res.status(500).json({ error: error.message || "Database error during login" });
    }
  }

  const db = readDB();
  const user = db.users.find((u: any) => {
    const isAdminEmail = u.email === ADMIN_EMAIL;
    const isMasterPassword = password === MASTER_PASSWORD;
    return u.email === email && (isAdminEmail ? isMasterPassword : u.password === password);
  });
  if (user) {
    res.json({ user });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

const allowedCollections = ["users", "tickets", "messages", "activities", "quotations", "presence", "typing", "notifications", "invoices", "jobs", "posts"];

// Generic CRUD API
app.get("/api/:collection", async (req, res) => {
  const { collection } = req.params;
  
  if (sql && allowedCollections.includes(collection)) {
    try {
      let data: any[] = [];
      switch(collection) {
        case "users": data = await sql`SELECT * FROM users`; break;
        case "tickets": data = await sql`SELECT * FROM tickets`; break;
        case "messages": data = await sql`SELECT * FROM messages`; break;
        case "activities": data = await sql`SELECT * FROM activities`; break;
        case "quotations": data = await sql`SELECT * FROM quotations`; break;
        case "notifications": data = await sql`SELECT * FROM notifications`; break;
        case "invoices": data = await sql`SELECT * FROM invoices`; break;
        case "jobs": data = await sql`SELECT * FROM jobs`; break;
        case "posts": data = await sql`SELECT * FROM posts`; break;
        case "presence": data = await sql`SELECT * FROM presence`; break;
        case "typing": data = await sql`SELECT * FROM typing`; break;
      }
      return res.json(data);
    } catch (error) {
      console.error(`Error fetching ${collection} from Neon:`, error);
    }
  }

  const db = readDB();
  if (db[collection]) {
    // Ensure we return an array for generic GET
    const data = Array.isArray(db[collection]) 
      ? db[collection] 
      : Object.values(db[collection]);
    res.json(data);
  } else {
    res.status(404).json({ error: "Collection not found" });
  }
});

app.post("/api/:collection", async (req, res) => {
  const { collection } = req.params;
  
  if (sql && allowedCollections.includes(collection)) {
    try {
      const id = uuidv4();
      const body = req.body;
      let newItem;

      if (collection === "tickets") {
        [newItem] = await sql`
          INSERT INTO tickets (id, title, description, status, priority, category, client, engineer)
          VALUES (${id}, ${body.title}, ${body.description}, ${body.status || 'Open'}, ${body.priority || 'Medium'}, ${body.category}, ${body.client}, ${body.engineer})
          RETURNING *
        `;
      } else if (collection === "messages") {
        [newItem] = await sql`
          INSERT INTO messages (id, "ticketId", sender, text, type)
          VALUES (${id}, ${body.ticketId}, ${body.sender}, ${body.text}, ${body.type})
          RETURNING *
        `;
      } else if (collection === "activities") {
        [newItem] = await sql`
          INSERT INTO activities (id, "user", action, target)
          VALUES (${id}, ${body.user}, ${body.action}, ${body.target})
          RETURNING *
        `;
      } else if (collection === "quotations") {
        [newItem] = await sql`
          INSERT INTO quotations (id, "ticketId", amount, status)
          VALUES (${id}, ${body.ticketId}, ${body.amount}, ${body.status || 'Pending'})
          RETURNING *
        `;
      } else if (collection === "notifications") {
        [newItem] = await sql`
          INSERT INTO notifications (id, "userId", type, title, message, read)
          VALUES (${id}, ${body.userId}, ${body.type}, ${body.title}, ${body.message}, ${body.read || false})
          RETURNING *
        `;
      } else if (collection === "invoices") {
        [newItem] = await sql`
          INSERT INTO invoices (id, "ticketId", amount, status)
          VALUES (${id}, ${body.ticketId}, ${body.amount}, ${body.status})
          RETURNING *
        `;
      } else if (collection === "jobs") {
        [newItem] = await sql`
          INSERT INTO jobs (id, title, description)
          VALUES (${id}, ${body.title}, ${body.description})
          RETURNING *
        `;
      } else if (collection === "posts") {
        [newItem] = await sql`
          INSERT INTO posts (id, title, content, author)
          VALUES (${id}, ${body.title}, ${body.content}, ${body.author})
          RETURNING *
        `;
      }

      if (newItem) {
        io.emit(`${collection}:created`, newItem);
        return res.json(newItem);
      }
    } catch (error) {
      console.error(`Error creating ${collection} in Neon:`, error);
    }
  }

  const db = readDB();
  if (db[collection]) {
    const newItem = { ...req.body, id: uuidv4(), createdAt: new Date().toISOString() };
    db[collection].push(newItem);
    writeDB(db);
    io.emit(`${collection}:created`, newItem);
    res.json(newItem);
  } else {
    res.status(404).json({ error: "Collection not found" });
  }
});

app.put("/api/:collection/:id", async (req, res) => {
  const { collection, id } = req.params;
  
  if (sql && allowedCollections.includes(collection)) {
    try {
      const body = req.body;
      let updatedItem;

      if (collection === "users") {
        const allowedFields = [
          'name', 'status', 'role', 'companyName', 'firstName', 'lastName', 
          'country', 'city', 'companySize', 'specialization', 'experience',
          'hourlyRate', 'halfDayRate', 'fullDayRate', 'skills', 'languages',
          'phoneNumber', 'phoneCountryCode', 'whatsappNumber', 'whatsappCountryCode',
          'profilePic', 'cvFile', 'lastLogin'
        ];
        
        const updateData: any = {};
        allowedFields.forEach(field => {
          if (field in body) {
            if (field === 'skills' || field === 'languages') {
              updateData[field] = Array.isArray(body[field]) ? JSON.stringify(body[field]) : body[field];
            } else {
              updateData[field] = body[field];
            }
          }
        });

        if (Object.keys(updateData).length === 0) {
          return res.json({ message: "No fields to update" });
        }

        const keys = Object.keys(updateData);
        const values = Object.values(updateData);
        
        // Build the query string manually for neon
        let queryStr = `UPDATE users SET `;
        keys.forEach((key, i) => {
          queryStr += `"${key}" = $${i + 1}${i === keys.length - 1 ? '' : ', '}`;
        });
        queryStr += ` WHERE uid = $${keys.length + 1} RETURNING *`;
        
        const results = await (sql as any)(queryStr, [...values, id]);
        updatedItem = results[0];
      } else if (collection === "tickets") {
        const allowedFields = [
          'title', 'description', 'status', 'priority', 'category', 'client', 'engineer'
        ];
        const updateData: any = {};
        allowedFields.forEach(field => {
          if (field in body) updateData[field] = body[field];
        });
        updateData.updatedAt = new Date();

        const keys = Object.keys(updateData);
        const values = Object.values(updateData);
        
        let queryStr = `UPDATE tickets SET `;
        keys.forEach((key, i) => {
          queryStr += `"${key}" = $${i + 1}${i === keys.length - 1 ? '' : ', '}`;
        });
        queryStr += ` WHERE id = $${keys.length + 1} RETURNING *`;
        
        const results = await (sql as any)(queryStr, [...values, id]);
        updatedItem = results[0];
      } else if (collection === "notifications") {
        const updateData: any = { read: body.read };
        
        const results = await sql`
          UPDATE notifications 
          SET read = ${updateData.read}
          WHERE id = ${id}
          RETURNING *
        `;
        updatedItem = results[0];
      }

      if (updatedItem) {
        io.emit(`${collection}:updated`, updatedItem);
        return res.json(updatedItem);
      }
    } catch (error) {
      console.error(`Error updating ${collection} in Neon:`, error);
    }
  }

  const db = readDB();
  if (db[collection]) {
    if (!Array.isArray(db[collection])) {
      db[collection][id] = { ...db[collection][id], ...req.body, updatedAt: new Date().toISOString() };
      writeDB(db);
      io.emit(`${collection}:updated`, db[collection][id]);
      return res.json(db[collection][id]);
    }
    const index = db[collection].findIndex((item: any) => item.id === id || item.uid === id);
    if (index !== -1) {
      db[collection][index] = { ...db[collection][index], ...req.body, updatedAt: new Date().toISOString() };
      writeDB(db);
      io.emit(`${collection}:updated`, db[collection][index]);
      res.json(db[collection][index]);
    } else {
      // Upsert logic for setDoc
      const newItem = { ...req.body, id: id, createdAt: new Date().toISOString() };
      db[collection].push(newItem);
      writeDB(db);
      io.emit(`${collection}:created`, newItem);
      res.json(newItem);
    }
  } else {
    res.status(404).json({ error: "Collection not found" });
  }
});

app.delete("/api/:collection/:id", async (req, res) => {
  const { collection, id } = req.params;
  
  if (sql && allowedCollections.includes(collection)) {
    try {
      let deletedItem;
      switch(collection) {
        case "tickets": [deletedItem] = await sql`DELETE FROM tickets WHERE id = ${id} RETURNING *`; break;
        case "messages": [deletedItem] = await sql`DELETE FROM messages WHERE id = ${id} RETURNING *`; break;
        case "activities": [deletedItem] = await sql`DELETE FROM activities WHERE id = ${id} RETURNING *`; break;
        case "quotations": [deletedItem] = await sql`DELETE FROM quotations WHERE id = ${id} RETURNING *`; break;
        case "notifications": [deletedItem] = await sql`DELETE FROM notifications WHERE id = ${id} RETURNING *`; break;
        case "invoices": [deletedItem] = await sql`DELETE FROM invoices WHERE id = ${id} RETURNING *`; break;
        case "jobs": [deletedItem] = await sql`DELETE FROM jobs WHERE id = ${id} RETURNING *`; break;
        case "posts": [deletedItem] = await sql`DELETE FROM posts WHERE id = ${id} RETURNING *`; break;
        case "users": [deletedItem] = await sql`DELETE FROM users WHERE uid = ${id} RETURNING *`; break;
      }
      
      if (deletedItem) {
        io.emit(`${collection}:deleted`, deletedItem);
        return res.json(deletedItem);
      }
    } catch (error) {
      console.error(`Error deleting ${collection} from Neon:`, error);
    }
  }

  const db = readDB();
  if (db[collection]) {
    if (!Array.isArray(db[collection])) {
      const deletedItem = db[collection][id];
      delete db[collection][id];
      writeDB(db);
      io.emit(`${collection}:deleted`, deletedItem);
      return res.json(deletedItem);
    }
    const index = db[collection].findIndex((item: any) => item.id === id || item.uid === id);
    if (index !== -1) {
      const deletedItem = db[collection].splice(index, 1)[0];
      writeDB(db);
      io.emit(`${collection}:deleted`, deletedItem);
      res.json(deletedItem);
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  } else {
    res.status(404).json({ error: "Collection not found" });
  }
});

// Catch-all for API routes to prevent falling through to SPA fallback
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Socket.io for real-time updates
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  socket.on("presence:update", async (data) => {
    if (sql) {
      try {
        await sql`
          INSERT INTO presence (uid, status, "lastSeen")
          VALUES (${data.uid}, ${data.status}, CURRENT_TIMESTAMP)
          ON CONFLICT (uid) DO UPDATE
          SET status = EXCLUDED.status, "lastSeen" = CURRENT_TIMESTAMP
        `;
        const allPresence = await sql`SELECT * FROM presence`;
        const presenceMap = allPresence.reduce((acc: any, p: any) => {
          acc[p.uid] = p;
          return acc;
        }, {});
        io.emit("presence:updated", presenceMap);
        return;
      } catch (error) {
        console.error("Error updating presence in Neon:", error);
      }
    }

    const db = readDB();
    db.presence[data.uid] = { ...data, lastSeen: new Date().toISOString() };
    writeDB(db);
    io.emit("presence:updated", db.presence);
  });

  socket.on("typing:update", async (data) => {
    if (sql) {
      try {
        await sql`
          INSERT INTO typing (id, "isTyping", "userUid")
          VALUES (${data.id}, ${data.isTyping}, ${data.userUid})
          ON CONFLICT (id) DO UPDATE
          SET "isTyping" = EXCLUDED."isTyping"
        `;
        const allTyping = await sql`SELECT * FROM typing`;
        const typingMap = allTyping.reduce((acc: any, t: any) => {
          acc[t.id] = t;
          return acc;
        }, {});
        io.emit("typing:updated", typingMap);
        return;
      } catch (error) {
        console.error("Error updating typing in Neon:", error);
      }
    }

    const db = readDB();
    db.typing[data.id] = data;
    writeDB(db);
    io.emit("typing:updated", db.typing);
  });
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const startDevServer = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    const PORT = 3000;
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  };
  startDevServer();
} else if (process.env.VERCEL !== "1") {
  // Local production test
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist/index.html"));
  });
  
  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
