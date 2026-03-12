-- SyncDoc PostgreSQL Schema
-- Run: psql -U postgres -f config/schema.sql

-- Create database (run manually if not exists)
-- CREATE DATABASE syncdoc;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(50) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  initials      VARCHAR(5) NOT NULL,
  color         VARCHAR(100) DEFAULT 'from-gray-400 to-gray-600',
  password_hash VARCHAR(255),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id          VARCHAR(50) PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  content     TEXT DEFAULT '',
  owner_id    VARCHAR(50) REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Document permissions
CREATE TABLE IF NOT EXISTS document_permissions (
  id          SERIAL PRIMARY KEY,
  document_id VARCHAR(50) REFERENCES documents(id) ON DELETE CASCADE,
  user_id     VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(10) CHECK (role IN ('owner', 'editor', 'viewer')) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS messages (
  id          VARCHAR(100) PRIMARY KEY,
  document_id VARCHAR(50) REFERENCES documents(id) ON DELETE CASCADE,
  user_id     VARCHAR(50) REFERENCES users(id),
  text        TEXT DEFAULT '',
  type        VARCHAR(10) DEFAULT 'text',
  file_url    TEXT,
  file_name   VARCHAR(255),
  mime_type   VARCHAR(100),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doc_perms_doc ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_perms_user ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_doc ON messages(document_id);

-- Seed users
INSERT INTO users (id, name, email, initials, color) VALUES
  ('u1', 'John Doe',      'john@syncdoc.com',  'JD', 'from-primary-400 to-primary-600'),
  ('u2', 'Sarah Miller',  'sarah@syncdoc.com', 'SM', 'from-secondary-400 to-secondary-600'),
  ('u3', 'Alex Kim',      'alex@syncdoc.com',  'AK', 'from-amber-400 to-orange-500'),
  ('u4', 'Emily Wright',  'emily@syncdoc.com', 'EW', 'from-violet-400 to-purple-500'),
  ('u5', 'Mike Chen',     'mike@syncdoc.com',  'MC', 'from-pink-400 to-rose-500')
ON CONFLICT (id) DO NOTHING;

-- Seed documents
INSERT INTO documents (id, title, content, owner_id) VALUES
  ('1', 'Project Roadmap Q4',     '', 'u1'),
  ('2', 'API Design Document',    '', 'u1'),
  ('3', 'Sprint Retrospective',   '', 'u2'),
  ('4', 'Brand Guidelines v2',    '', 'u4'),
  ('5', 'Meeting Notes – Kickoff','', 'u1'),
  ('6', 'Feature Spec – Chat',   '', 'u5')
ON CONFLICT (id) DO NOTHING;

-- Seed permissions
INSERT INTO document_permissions (document_id, user_id, role) VALUES
  ('1', 'u1', 'owner'),
  ('1', 'u2', 'editor'),
  ('1', 'u3', 'editor'),
  ('2', 'u1', 'owner'),
  ('2', 'u5', 'editor'),
  ('3', 'u2', 'owner'),
  ('3', 'u1', 'viewer'),
  ('4', 'u4', 'owner'),
  ('4', 'u1', 'viewer'),
  ('5', 'u1', 'owner'),
  ('6', 'u5', 'owner'),
  ('6', 'u1', 'editor'),
  ('6', 'u2', 'editor')
ON CONFLICT (document_id, user_id) DO NOTHING;
