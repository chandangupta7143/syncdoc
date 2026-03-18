# SyncDoc – AI-Powered Collaborative Workspace

SyncDoc is a real-time, collaborative document workspace (similar to Notion or Google Docs) where multiple users can edit, chat, and share files simultaneously. Built with a robust full-stack architecture, it features Role-Based Access Control (RBAC), real-time presence indicators, live chat, and AI-powered document insights using Google Gemini.

---

## 🚀 Live Demo & Repository
- **Frontend**: [Link to Frontend] (Vite + React + TypeScript + Tailwind CSS)
- **Backend**: [Link to Backend] (Node.js + Express + Socket.io + PostgreSQL)
- **Repository**: [Your GitHub Link]

---

## ✨ Key Features

### 1. Dashboard & RBAC (Role-Based Access Control)
- **Document Management**: Create, rename, delete, and organize your workspace.
- **Sharing System**: Invite collaborators via email with specific roles.
- **Strict Permissions**:
  - **Owner**: Full control (edit, share, delete doc, manage permissions).
  - **Editor**: Can edit text, send messages, and upload files.
  - **Viewer**: Read-only access to the document and chat.
- **Security**: Backend enforces roles at the API and WebSocket levels (unauthorized requests return 403 Forbidden).

### 2. Collaborative Workspace
- **Real-Time Editor**: Rich-text block-based editor with instant synchronization.
- **Presence & Cursors**: See who is currently viewing the document.
- **Conflict Resolution**: Graceful handling of simultaneous edits via debounced broadcasting and version-checking to ensure data integrity.

### 3. Real-Time Chat & File Sharing
- **Live Chat Sidebar**: Communicate with collaborators in real-time within each document.
- **File Sharing**: Upload images, PDFs, and other assets directly into the chat stream.
- **Cloud Storage**: Securely store files using Cloudinary/S3 integration.

### 4. Gemini AI Insights
- **Smart Actions**: "Summarize Document" and "Fix Grammar & Tone" buttons.
- **Streaming Response**: Real-time token-streaming view for an interactive AI experience.
- **Integration**: Direct integration with Google Gemini SDK for high-performance LLM capabilities.

---

## 🛠️ Technical Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, TipTap (Editor).
- **Backend**: Node.js, Express, Socket.io (WebSockets), Multer (FileUpload).
- **Database**: PostgreSQL (Prisma/Pool) or MongoDB.
- **AI**: Google Gemini AI (Generative Model SDK).
- **Storage**: Cloudinary (Cloud media storage).

---

## 🏗️ Project Architecture

### Real-Time Concurrency (Simultaneous Edits)
To handle multiple users editing the same document without data loss or race conditions, SyncDoc employs a **Hybrid Synchronization Strategy**:
- **Debounced Broadcasting**: Client edits are collected and sent via WebSockets with a 500ms debounce to reduce network chatter.
- **Version Tracking (Sequence Numbers)**: Each document keeps a `updated_at` timestamp. Before applying a remote update, the server verifies the source's relevance to prevent overwriting newer changes with stale data.
- **Optimistic UI Updates**: Local changes are reflected immediately, while server confirmation ensures final consistency across all connected clients.

### RBAC Database Schema (PostgreSQL)

```mermaid
erDiagram
    Users ||--o{ Documents : "owns"
    Users ||--o{ Document_Permissions : "has"
    Documents ||--o| Users : "has_owner"
    Documents ||--o{ Document_Permissions : "has_perms"
    Documents ||--o{ Messages : "contains"
    Documents ||--o{ Files : "attached"

    Users {
        uuid id PK
        string name
        string email UK
        string password
        timestamp created_at
    }

    Documents {
        uuid id PK
        string title
        text content
        uuid owner_id FK
        timestamp created_at
        timestamp updated_at
    }

    Document_Permissions {
        uuid id PK
        uuid document_id FK
        uuid user_id FK
        string role "owner|editor|viewer"
    }

    Messages {
        uuid id PK
        uuid document_id FK
        uuid user_id FK
        text text
        string type "text|file"
        string file_url
    }
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Local or Neon/Supabase)
- Gemini AI API Key
- Cloudinary Accounts (Optional for file uploads)

### 1. Clone & Install
```bash
git clone [repository-url]
cd syncdoc

# Install Frontend dependencies
npm install

# Install Backend dependencies
cd backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/syncdoc
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret
```

### 3. Database Initialization
Run the included `init.sql` script or use your preferred ORM tool to sync the schema.

### 4. Start the Application
```bash
# In the root (Frontend)
npm run dev

# In the backend directory
npm run dev
```

---

## 📄 License
MIT License. Created for Regrip India Full-Stack Engineering Assignment.
