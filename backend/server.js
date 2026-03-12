const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const { analyzeDocument } = require('./services/gemini');

const bcrypt = require('bcryptjs');
const { authenticateToken, generateToken } = require('./middleware/auth');
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Database Connection ──────────────────────────────

const pool = require('./config/db');
let dbAvailable = false;

(async () => {
  try {
    await pool.query('SELECT NOW()');
    dbAvailable = true;
    console.log('✅ PostgreSQL connected — using database');
    
    // Automatically initialize schemas if they don't exist
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
    await pool.query(initSql);
    console.log('✅ PostgreSQL schemas initialized');
  } catch (err) {
    dbAvailable = false;
    console.log('⚠️  PostgreSQL unavailable — using in-memory fallback.', err.message);
  }
})();

// ── In-Memory Fallbacks (used when DB not available) ─

const memDocContents = new Map();
const memDocUsers = new Map();
const memDocMessages = new Map();
const memUsersDB = new Map([
  ['john@syncdoc.com',  { id: 'u1', name: 'John Doe',     email: 'john@syncdoc.com',  initials: 'JD', color: 'from-primary-400 to-primary-600' }],
  ['sarah@syncdoc.com', { id: 'u2', name: 'Sarah Miller', email: 'sarah@syncdoc.com', initials: 'SM', color: 'from-secondary-400 to-secondary-600' }],
  ['alex@syncdoc.com',  { id: 'u3', name: 'Alex Kim',     email: 'alex@syncdoc.com',  initials: 'AK', color: 'from-amber-400 to-orange-500' }],
  ['emily@syncdoc.com', { id: 'u4', name: 'Emily Wright', email: 'emily@syncdoc.com', initials: 'EW', color: 'from-violet-400 to-purple-500' }],
  ['mike@syncdoc.com',  { id: 'u5', name: 'Mike Chen',    email: 'mike@syncdoc.com',  initials: 'MC', color: 'from-pink-400 to-rose-500' }],
]);
const memDocPerms = new Map();
// Seed permissions
(() => {
  const d1 = new Map(); d1.set('u1', { role: 'owner', user: memUsersDB.get('john@syncdoc.com') }); d1.set('u2', { role: 'editor', user: memUsersDB.get('sarah@syncdoc.com') }); d1.set('u3', { role: 'editor', user: memUsersDB.get('alex@syncdoc.com') }); memDocPerms.set('1', d1);
  const d2 = new Map(); d2.set('u1', { role: 'owner', user: memUsersDB.get('john@syncdoc.com') }); d2.set('u5', { role: 'editor', user: memUsersDB.get('mike@syncdoc.com') }); memDocPerms.set('2', d2);
  const d3 = new Map(); d3.set('u2', { role: 'owner', user: memUsersDB.get('sarah@syncdoc.com') }); d3.set('u1', { role: 'viewer', user: memUsersDB.get('john@syncdoc.com') }); memDocPerms.set('3', d3);
})();

// ── Cloudinary ───────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt|svg|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) || allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only images, PDFs, and documents are allowed'));
  },
});

// ── Socket.io ────────────────────────────────────────

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── RBAC Helpers ─────────────────────────────────────

const ROLE_LEVELS = { owner: 3, editor: 2, viewer: 1 };

async function getUserRole(documentId, userId) {
  if (dbAvailable) {
    const result = await pool.query(
      'SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2',
      [documentId, userId]
    );
    // If not in DB, assume they are the owner of a newly created mock document
    return result.rows.length > 0 ? result.rows[0].role : 'owner';
  }
  const perms = memDocPerms.get(documentId);
  // Default to owner if the document permissions don't exist yet (mock creation)
  return perms?.get(userId)?.role || 'owner';
}

async function hasPermission(documentId, userId, requiredRole) {
  const role = await getUserRole(documentId, userId);
  if (!role) return false;
  return ROLE_LEVELS[role] >= ROLE_LEVELS[requiredRole];
}

function checkPermission(requiredRole) {
  return async (req, res, next) => {
    const documentId = req.params.documentId || req.body.documentId;
    const userId = req.headers['x-user-id'] || 'u1';
    if (!(await hasPermission(documentId, userId, requiredRole))) {
      return res.status(403).json({ error: 'Forbidden', message: `You need "${requiredRole}" access or above.` });
    }
    req.userId = userId;
    req.userRole = await getUserRole(documentId, userId);
    next();
  };
}

// ── REST Routes ──────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ status: 'SyncDoc server running', db: dbAvailable ? 'PostgreSQL' : 'in-memory', timestamp: new Date().toISOString() });
});

// ── Authentication Routes ────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  try {
    if (dbAvailable) {
      const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (check.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, hashedPassword]
      );
      
      const user = result.rows[0];
      const token = generateToken(user);
      return res.status(201).json({ user, token });
    } else {
      // In-Memory fallback
      if (memUsersDB.has(email)) return res.status(400).json({ error: 'Email already exists' });
      const user = { id: `u${Date.now()}`, name, email, password }; // Hash skipped for mock
      memUsersDB.set(email, user);
      const token = generateToken(user);
      return res.status(201).json({ user: { id: user.id, name, email }, token });
    }
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    if (dbAvailable) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(400).json({ error: 'Invalid credentials' });

      const token = generateToken(user);
      return res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
    } else {
      // In-Memory fallback
      const user = memUsersDB.get(email);
      if (!user || user.password !== password) return res.status(400).json({ error: 'Invalid credentials' });
      
      const token = generateToken(user);
      return res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});
// ── Documents CRUD Routes ──────────────────────────

app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    if (dbAvailable) {
      const result = await pool.query(
        `SELECT d.id, d.title, d.created_at, d.updated_at, dp.role, u.name as owner_name, u.email as owner_email
         FROM documents d
         JOIN document_permissions dp ON d.id = dp.document_id
         JOIN users u ON d.owner_id = u.id
         WHERE dp.user_id = $1
         ORDER BY d.updated_at DESC`,
        [req.user.id]
      );
      return res.json({ documents: result.rows });
    }
    // Simple fallback
    res.json({ documents: [] });
  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({ error: 'Server error fetching documents' });
  }
});

app.post('/api/documents', authenticateToken, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    if (dbAvailable) {
      // Create Document
      const docResult = await pool.query(
        'INSERT INTO documents (title, owner_id) VALUES ($1, $2) RETURNING id',
        [title, req.user.id]
      );
      const documentId = docResult.rows[0].id;
      
      // Auto-assign Owner permission
      await pool.query(
        'INSERT INTO document_permissions (document_id, user_id, role) VALUES ($1, $2, $3)',
        [documentId, req.user.id, 'owner']
      );

      return res.status(201).json({ id: documentId, title });
    }
    res.status(201).json({ id: `doc-${Date.now()}` });
  } catch (err) {
    console.error('Create document error:', err);
    res.status(500).json({ error: 'Server error creating document' });
  }
});

app.get('/api/documents/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (dbAvailable) {
      // Verify permission
      const permResult = await pool.query(
        'SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      
      if (permResult.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
      const role = permResult.rows[0].role;

      const docResult = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
      if (docResult.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
      
      return res.json({ document: docResult.rows[0], role });
    }
    res.json({ document: { id, content: memDocContents.get(`document-${id}`) || '' }, role: 'owner' });
  } catch (err) {
    console.error('Get document details error:', err);
    res.status(500).json({ error: 'Server error fetching document' });
  }
});

app.put('/api/documents/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  
  try {
    if (dbAvailable) {
      // RBAC Validation
      const permResult = await pool.query(
        'SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      if (permResult.rows.length === 0 || permResult.rows[0].role === 'viewer') {
        return res.status(403).json({ error: 'Viewers are forbidden from modifying document content' });
      }

      const updateFields = [];
      const values = [];
      let counter = 1;

      if (title !== undefined) {
        updateFields.push(`title = $${counter++}`);
        values.push(title);
      }
      if (content !== undefined) {
        updateFields.push(`content = $${counter++}`);
        values.push(content);
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = NOW()`);
        values.push(id);
        const query = `UPDATE documents SET ${updateFields.join(', ')} WHERE id = $${counter} RETURNING *`;
        const result = await pool.query(query, values);
        return res.json({ document: result.rows[0] });
      }
      return res.json({ success: true });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Update document error:', err);
    res.status(500).json({ error: 'Server error updating document' });
  }
});

app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (dbAvailable) {
      // STRICT OWNER VALIDATION
      const permResult = await pool.query(
        'SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      if (permResult.rows.length === 0 || permResult.rows[0].role !== 'owner') {
        return res.status(403).json({ error: 'Only the Owner can delete this document' });
      }

      await pool.query('DELETE FROM documents WHERE id = $1', [id]);
      return res.json({ success: true });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ error: 'Server error deleting document' });
  }
});

// Get permissions
app.get('/api/documents/:documentId/permissions', authenticateToken, async (req, res) => {
  const { documentId } = req.params;
  try {
    if (dbAvailable) {
      // Must be at least a viewer to see permissions
      const check = await pool.query('SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2', [documentId, req.user.id]);
      if (check.rows.length === 0) return res.status(403).json({ error: 'Access denied' });

      const result = await pool.query(
        `SELECT dp.user_id AS "userId", dp.role, u.name, u.email
         FROM document_permissions dp
         JOIN users u ON dp.user_id = u.id
         WHERE dp.document_id = $1
         ORDER BY dp.role ASC`,
        [documentId]
      );
      return res.json({ permissions: result.rows });
    }
    const perms = memDocPerms.get(documentId);
    if (!perms) return res.json({ permissions: [] });
    const list = Array.from(perms.entries()).map(([userId, entry]) => ({
      userId, role: entry.role, name: entry.user?.name || 'Unknown', email: entry.user?.email || '', initials: entry.user?.initials || '??', color: entry.user?.color || 'from-gray-400 to-gray-600',
    }));
    res.json({ permissions: list });
  } catch (err) {
    console.error('Get permissions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Share document
app.post('/api/documents/:documentId/share', authenticateToken, async (req, res) => {
  const { documentId } = req.params;
  const { email, role } = req.body;

  if (!email || !role) return res.status(400).json({ error: 'Email and role are required' });
  if (!['editor', 'viewer'].includes(role)) return res.status(400).json({ error: 'Role must be editor or viewer' });

  try {
    if (dbAvailable) {
      // Require caller to be the Owner
      const ownerCheck = await pool.query('SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2', [documentId, req.user.id]);
      if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].role !== 'owner') {
        return res.status(403).json({ error: 'Only the Owner can share this document' });
      }

      const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found with that email' });
      const targetUser = userRes.rows[0];

      // Check if target is already owner
      const existingRes = await pool.query('SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2', [documentId, targetUser.id]);
      if (existingRes.rows.length > 0 && existingRes.rows[0].role === 'owner') {
        return res.status(400).json({ error: 'Cannot change owner role' });
      }

      await pool.query(
        `INSERT INTO document_permissions (document_id, user_id, role) VALUES ($1, $2, $3)
         ON CONFLICT (document_id, user_id) DO UPDATE SET role = $3`,
        [documentId, targetUser.id, role]
      );

      console.log(`🔐 Shared doc ${documentId} with ${email} as ${role}`);
      return res.json({ success: true, permission: { userId: targetUser.id, role, name: targetUser.name, email: targetUser.email, initials: '??', color: 'from-gray-400 to-gray-600' } });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Share error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove permission
app.delete('/documents/:documentId/share/:userId', checkPermission('owner'), async (req, res) => {
  const { documentId, userId } = req.params;
  try {
    if (dbAvailable) {
      const check = await pool.query('SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2', [documentId, userId]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Permission not found' });
      if (check.rows[0].role === 'owner') return res.status(400).json({ error: 'Cannot remove owner' });
      await pool.query('DELETE FROM document_permissions WHERE document_id = $1 AND user_id = $2', [documentId, userId]);
      return res.json({ success: true });
    }
    const perms = memDocPerms.get(documentId);
    if (!perms?.has(userId)) return res.status(404).json({ error: 'Permission not found' });
    if (perms.get(userId).role === 'owner') return res.status(400).json({ error: 'Cannot remove owner' });
    perms.delete(userId);
    res.json({ success: true });
  } catch (err) {
    console.error('Remove permission error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user role
app.get('/documents/:documentId/role', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1';
  const { documentId } = req.params;
  const role = (await getUserRole(documentId, userId)) || 'viewer';
  res.json({ role, userId });
});

// File upload
app.post('/api/documents/:documentId/files', authenticateToken, upload.single('file'), async (req, res) => {
  const { documentId } = req.params;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    if (dbAvailable) {
      // Must be at least Editor to upload files
      const permRes = await pool.query('SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2', [documentId, req.user.id]);
      if (permRes.rows.length === 0 || permRes.rows[0].role === 'viewer') {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Viewers cannot upload files' });
      }
    }

    let fileUrl = '';
    const cloudinaryOk = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';
    if (cloudinaryOk) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'syncdoc', resource_type: 'auto' });
      fileUrl = result.secure_url;
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } else {
      fileUrl = `http://localhost:5000/files/${req.file.filename}`;
    }

    // Save to Database
    if (dbAvailable) {
      await pool.query(
        'INSERT INTO files (document_id, user_id, file_url) VALUES ($1, $2, $3)',
        [documentId, req.user.id, fileUrl]
      );
    }

    res.json({ url: fileUrl, fileName: req.file.originalname, fileSize: req.file.size, mimeType: req.file.mimetype });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.use('/files', express.static(uploadsDir));

// ── AI Analyze (streaming SSE) ───────────────────────

app.post('/ai/analyze', async (req, res) => {
  const { action, content } = req.body;
  if (!action || !content) {
    return res.status(400).json({ error: 'Action and content are required' });
  }
  if (!['summarize', 'fix-grammar'].includes(action)) {
    return res.status(400).json({ error: 'Action must be summarize or fix-grammar' });
  }
  try {
    await analyzeDocument(action, content, res);
  } catch (err) {
    console.error('AI analyze error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI analysis failed' });
    }
  }
});

// ── Socket.io Events ─────────────────────────────────

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: No token provided'));

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`✅ User connected via WebSockets: ${socket.user.name} (${socket.id})`);

  let currentRoom = null;
  let currentUser = null;
  let currentDocId = null;

  // ── Join Document ──────────────────────────────────
  socket.on('join-document', async ({ documentId }) => {
    currentRoom = `document-${documentId}`;
    currentDocId = documentId;

    let role = 'viewer';
    if (dbAvailable) {
      const permRes = await pool.query('SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2', [documentId, socket.user.id]);
      if (permRes.rows.length > 0) Object.assign(role, permRes.rows[0].role);
    } else {
      role = await getUserRole(documentId, socket.user.id);
    }

    currentUser = {
      socketId: socket.id,
      userId: socket.user.id,
      name: socket.user.name || 'Anonymous',
      initials: socket.user.name ? socket.user.name.split(' ').map((n) => n[0]).join('').substring(0,2).toUpperCase() : 'AN',
      color: 'from-primary-400 to-primary-600',
      status: 'viewing',
      role,
    };

    socket.join(currentRoom);

    if (!memDocUsers.has(currentRoom)) memDocUsers.set(currentRoom, new Map());
    memDocUsers.get(currentRoom).set(socket.id, currentUser);

    // Load document content
    if (dbAvailable) {
      try {
        const docRes = await pool.query('SELECT content FROM documents WHERE id = $1', [documentId]);
        if (docRes.rows.length > 0 && docRes.rows[0].content) {
          socket.emit('document-load', { content: docRes.rows[0].content });
        }
      } catch (err) { console.error('Load doc error:', err); }
    } else if (memDocContents.has(currentRoom)) {
      socket.emit('document-load', { content: memDocContents.get(currentRoom) });
    }

    // Load chat history
    if (dbAvailable) {
      try {
        const msgRes = await pool.query(
          `SELECT m.id, u.name AS user, u.name as initials, m.text, m.type,
                  m.file_url AS "fileUrl", m.file_name AS "fileName", m.mime_type AS "mimeType",
                  TO_CHAR(m.created_at, 'HH12:MI AM') AS time, '' AS "socketId"
           FROM messages m JOIN users u ON m.user_id = u.id
           WHERE m.document_id = $1 ORDER BY m.created_at ASC`,
          [documentId]
        );
        if (msgRes.rows.length > 0) socket.emit('chat-history', { messages: msgRes.rows });
      } catch (err) { console.error('Load messages error:', err); }
    } else if (memDocMessages.has(currentRoom)) {
      socket.emit('chat-history', { messages: memDocMessages.get(currentRoom) });
    }

    const usersInRoom = Array.from(memDocUsers.get(currentRoom).values());
    socket.emit('room-users', { users: usersInRoom });
    socket.emit('your-role', { role });
    socket.to(currentRoom).emit('user-joined', { user: currentUser, users: usersInRoom });
  });

  // ── Document Change ────────────────────────────────
  socket.on('document-change', async ({ documentId, content }) => {
    let role = 'viewer';
    if (dbAvailable) {
      const permRes = await pool.query('SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2', [documentId, socket.user.id]);
      if (permRes.rows.length > 0) role = permRes.rows[0].role;
    }
    
    if (role === 'viewer') {
      socket.emit('permission-denied', { action: 'edit', message: 'Viewers cannot edit documents.' });
      return;
    }

    const room = `document-${documentId}`;

    // Persist to database
    if (dbAvailable) {
      try {
        await pool.query('UPDATE documents SET content = $1, updated_at = NOW() WHERE id = $2', [content, documentId]);
      } catch (err) { console.error('Save doc error:', err); }
    }
    memDocContents.set(room, content);

    if (memDocUsers.has(room) && memDocUsers.get(room).has(socket.id)) {
      memDocUsers.get(room).get(socket.id).status = 'editing';
    }

    socket.to(room).emit('document-change', { content, userId: socket.id });
  });

  // ── Cursor Update ──────────────────────────────────
  socket.on('cursor-update', ({ documentId, cursor }) => {
    socket.to(`document-${documentId}`).emit('cursor-update', { userId: socket.id, user: currentUser, cursor });
  });

  // ── Chat: Send Message ─────────────────────────────
  socket.on('send-message', async ({ documentId, message }) => {
    let role = 'viewer';
    if (dbAvailable) {
      const permRes = await pool.query('SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2', [documentId, socket.user.id]);
      if (permRes.rows.length > 0) role = permRes.rows[0].role;
    }

    if (role === 'viewer') {
      socket.emit('permission-denied', { action: 'chat', message: 'Viewers cannot send messages.' });
      return;
    }

    const room = `document-${documentId}`;
    const msgId = `${Date.now()}-${socket.id}`;
    const chatMessage = {
      id: msgId,
      user: currentUser?.name || 'Anonymous',
      initials: currentUser?.initials || 'AN',
      color: currentUser?.color || 'from-gray-400 to-gray-600',
      text: message.text || '',
      type: message.type || 'text',
      fileUrl: message.fileUrl || null,
      fileName: message.fileName || null,
      mimeType: message.mimeType || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      socketId: socket.id,
    };

    // Persist to database
    if (dbAvailable) {
      try {
        await pool.query(
          `INSERT INTO messages (document_id, user_id, text, type, file_url, file_name, mime_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [documentId, socket.user.id, message.text || '', message.type || 'text', message.fileUrl || null, message.fileName || null, message.mimeType || null]
        );
      } catch (err) { console.error('Save message error:', err); }
    }

    // In-memory fallback
    if (!memDocMessages.has(room)) memDocMessages.set(room, []);
    memDocMessages.get(room).push(chatMessage);

    io.to(room).emit('receive-message', chatMessage);
  });

  // ── Leave / Disconnect ─────────────────────────────
  socket.on('leave-document', ({ documentId }) => handleLeaveRoom(socket, `document-${documentId}`));

  socket.on('disconnect', () => {
    if (currentRoom) handleLeaveRoom(socket, currentRoom);
    console.log(`❌ User disconnected: ${socket.id}`);
  });

  function handleLeaveRoom(sock, room) {
    sock.leave(room);
    if (memDocUsers.has(room)) {
      memDocUsers.get(room).delete(sock.id);
      const usersInRoom = Array.from(memDocUsers.get(room).values());
      sock.to(room).emit('user-left', { userId: sock.id, users: usersInRoom });
      if (usersInRoom.length === 0) memDocUsers.delete(room);
    }
  }
});

// Start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 SyncDoc server running on http://localhost:${PORT}\n`);
});
