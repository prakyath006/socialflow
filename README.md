# 🚀 SocialFlow — Multi-Platform Social Media Publishing & Management Engine

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/express-4.18.2-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-sequelize_6.37-blue)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/vite-5.0.12-646CFF.svg)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**SocialFlow** is a modern, enterprise-ready **MERN/PERN stack** social media management engine. It provides a centralized hub to create, schedule, publish, optimize, and analyze content across **8 major social media platforms** with native video and image processing, visual content calendar, real-time analytics, and automated scheduling workflows.

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🌐 Supported Platforms & Specs](#-supported-platforms--specs)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Project Structure](#-project-structure)
- [⚙️ Prerequisites](#️-prerequisites)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [🔐 Environment Variables](#-environment-variables)
- [🗄️ Database & Demo Mode](#️-database--demo-mode)
- [📡 API Endpoints Overview](#-api-endpoints-overview)
- [🐳 Docker & Cloud Deployment](#-docker--cloud-deployment)
- [📜 Available npm Scripts](#-available-npm-scripts)
- [📄 License](#-license)

---

## ✨ Key Features

- **🔌 Multi-Platform Adapter Architecture**: Extensible adapter pattern enabling seamless publishing across **Facebook, Instagram, X (Twitter), LinkedIn, YouTube, Pinterest, Telegram, and WhatsApp Business**.
- **📅 Visual Content Planner & Calendar**: Drag-and-and-plan interactive calendar (monthly & weekly views) to schedule posts, manage visual queues, and track publication status.
- **⚡ Automated Scheduling Engine**: Background cron job engine (`node-cron`) that automatically parses, validates platform character limits & aspect ratios, and dispatches queued posts at target publication times.
- **🖼️ Automated Media Processing Pipeline**:
  - Image resizing, format conversion, and watermark capabilities using **Sharp**.
  - Video resolution formatting, aspect ratio validation, and automatic video thumbnail extraction using **Fluent-FFmpeg**.
- **📊 Real-Time Analytics & Performance Dashboard**: Visual performance monitoring featuring charts (powered by **Recharts**) tracking engagement rates, total reach, impressions, top-performing platforms, and post-level metrics.
- **🔐 OAuth 2.0 & Token Refresh Lifecycle**: Built-in token manager to handle OAuth authentication flows, access token storage, and automatic refresh token rotation.
- **🛡️ Resilience & Demo Mode Fallback**: Built-in graceful degradation — if PostgreSQL is not connected, SocialFlow operates seamlessly in **Demo Mode** with seed data so you can test all UI features instantly without database dependencies.
- **🐳 Cloud-Ready Docker Architecture**: Includes optimized Dockerfile with FFmpeg pre-installed, fully ready for Cloud Run, AWS ECS, or containerized production deployment.

---

## 🌐 Supported Platforms & Specs

| Platform | Max Text | Supported Media | Key Features & Constraints |
| :--- | :--- | :--- | :--- |
| **Facebook** | 63,206 chars | Images, Videos, GIFs | Page/Profile posting, link previews, multi-image support |
| **Instagram** | 2,200 chars | Images, Videos, Carousels | Up to 30 hashtags, aspect ratios (1:1, 4:5, 9:16), image/video requirements |
| **X (Twitter)** | 280 chars | Images, Videos, GIFs | Character counter, media attachment limits (4 images or 1 video) |
| **LinkedIn** | 3,000 chars | Images, Videos, Documents | Personal & Company Page posting, professional formatting |
| **YouTube** | 100 title / 5K desc | Videos | Video uploads, custom thumbnail setting, tags & category selection |
| **Pinterest** | 500 chars | Images, Videos | Board selection, destination links, vertical image recommendations (2:3) |
| **Telegram** | 4,096 chars | Images, Videos, Audio, Docs | Channel & Group broadcasting, HTML/Markdown formatting |
| **WhatsApp Business** | 4,096 chars | Images, Videos, Audio, Docs | Direct message template & broadcast support via Cloud API |

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Animations & Icons**: [Framer Motion](https://www.framer.com/motion/) + [React Icons](https://react-icons.github.io/react-icons/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)
- **Date Picking**: [React Datepicker](https://reactdatepicker.com/)
- **Styling**: Vanilla CSS Design System with CSS variables and modern glassmorphism UI elements.

### **Backend**
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules `import/export`)
- **Server Framework**: [Express 4](https://expressjs.com/)
- **Database / ORM**: [PostgreSQL](https://www.postgresql.org/) + [Sequelize ORM](https://sequelize.org/)
- **Task Scheduler**: [Node-Cron](https://github.com/node-cron/node-cron)
- **Media Processing**: [Sharp](https://sharp.pixelplumbing.com/) (Images) + [Fluent-FFmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) (Videos)
- **File Uploads**: [Multer](https://github.com/expressjs/multer)
- **Email Service**: [Nodemailer](https://nodemailer.com/)
- **Security & Middleware**: [JSONWebToken](https://jwt.io/), [BcryptJS](https://github.com/dcodeIO/bcrypt.js), [Helmet](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors), [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)

### **DevOps & Infrastructure**
- **Containerization**: Docker (Node 20 Slim + FFmpeg)
- **Deployment Targets**: Google Cloud Run / Docker Compose / AWS

---

## 📂 Project Structure

```
socialflow/
├── client/                     # Vite + React Frontend Application
│   ├── index.html              # Entry HTML template
│   └── src/
│       ├── App.jsx             # Main router & app layout container
│       ├── main.jsx            # React root DOM renderer
│       ├── index.css           # Global CSS design tokens & theme stylesheet
│       ├── components/         # Reusable UI components (Navbar, Sidebar, PostCard, etc.)
│       ├── pages/              # Main application views
│       │   ├── Dashboard.jsx   # Analytics overview & platform summary
│       │   ├── Compose.jsx     # Multi-platform post creation editor & preview
│       │   ├── Posts.jsx       # Feed of scheduled, published & draft posts
│       │   ├── Calendar.jsx    # Visual content scheduling calendar
│       │   ├── MediaLibrary.jsx# Asset manager for uploaded images & videos
│       │   ├── Analytics.jsx  # Detailed performance charts & breakdowns
│       │   ├── Platforms.jsx  # OAuth platform connection management
│       │   ├── Settings.jsx   # Profile & system configurations
│       │   └── Login.jsx      # User authentication login view
│       ├── services/           # Axios API client services
│       ├── store/              # Zustand global state stores
│       └── utils/              # Helper utilities & date formatters
├── server/                     # Express.js REST API Backend
│   ├── index.js                # Server entrypoint & middleware setup
│   ├── seed.js                 # Seed script for sample database records
│   ├── config/
│   │   ├── db.js               # PostgreSQL Sequelize database connection setup
│   │   └── platforms.js        # Social platform constraint specifications & limits
│   ├── adapters/               # Platform-specific API integration adapters
│   │   ├── BaseAdapter.js      # Base adapter template class
│   │   ├── FacebookAdapter.js  # Facebook Graph API adapter
│   │   ├── InstagramAdapter.js # Instagram Graph API adapter
│   │   ├── TwitterAdapter.js   # Twitter/X API v2 adapter
│   │   ├── LinkedInAdapter.js  # LinkedIn REST API adapter
│   │   ├── YouTubeAdapter.js   # YouTube Data API v3 adapter
│   │   ├── PinterestAdapter.js # Pinterest API v5 adapter
│   │   ├── TelegramAdapter.js  # Telegram Bot API adapter
│   │   └── WhatsAppAdapter.js  # WhatsApp Business Cloud API adapter
│   ├── models/                 # Sequelize database models
│   │   ├── User.js             # User account schema
│   │   ├── Post.js             # Post content & scheduling schema
│   │   ├── Media.js            # Uploaded asset schema
│   │   └── Analytics.js        # Post performance metric schema
│   ├── routes/                 # Express API router definitions
│   │   ├── auth.js             # Authentication & account management routes
│   │   ├── posts.js            # Post creation, editing & scheduling routes
│   │   ├── media.js            # File upload & processing routes
│   │   ├── platforms.js        # OAuth link & callback handling
│   │   └── analytics.js        # Analytics data aggregation routes
│   └── services/               # Core backend engine services
│       ├── publishingEngine.js # Multi-platform publication dispatcher engine
│       ├── schedulingEngine.js # Background cron job processor
│       ├── mediaProcessor.js   # Image/Video optimization service (Sharp/FFmpeg)
│       ├── tokenManager.js     # Access token encryption & refresh loop
│       └── emailService.js     # Nodemailer email notification handler
├── Dockerfile                  # Docker build instructions with FFmpeg
├── vite.config.js              # Vite bundler configuration
├── package.json                # Main dependency manifest & scripts
└── README.md                   # Project documentation
```

---

## ⚙️ Prerequisites

Before running SocialFlow locally, ensure you have the following installed on your machine:

1. **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: `v9.0.0` or higher (comes bundled with Node.js)
3. **FFmpeg** *(Optional for local video processing, pre-configured in Docker)*:
   - **macOS**: `brew install ffmpeg`
   - **Windows**: `choco install ffmpeg` or download from [FFmpeg Official Site](https://ffmpeg.org/)
   - **Linux**: `sudo apt install ffmpeg`
4. **PostgreSQL** *(Optional — Demo Mode works out-of-the-box if omitted)*: `v14` or higher

---

## 🚀 Quick Start & Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/prakyath006/socialflow.git
cd socialflow
```

### Step 2: Install Dependencies

Install all root, backend, and frontend dependencies in one command:

```bash
npm install
```

### Step 3: Setup Environment Variables

Copy the provided example environment configuration file:

```bash
cp .env.example .env
```

Open `.env` in your text editor and customize the parameters (e.g. `DATABASE_URL`, `JWT_SECRET`, and social platform API keys).

### Step 4: Seed Database *(Optional)*

To populate sample users, posts, media assets, and analytics data:

```bash
npm run seed
```

### Step 5: Start the Development Server

Run both the Express backend server and the Vite frontend application concurrently:

```bash
npm run dev
```

- **Frontend App**: Spun up at [`http://localhost:3001`](http://localhost:3001)
- **Backend Express API**: Running at [`http://localhost:3000`](http://localhost:3000)

---

## 🔐 Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend API server port | `3000` |
| `NODE_ENV` | Application environment (`development` / `production`) | `development` |
| `DATABASE_URL` | PostgreSQL connection connection URI | `postgres://postgres:postgres@localhost:5432/socialflow` |
| `JWT_SECRET` | Secret key for signing authentication JSON Web Tokens | `your_secret_key` |
| `STORAGE_TYPE` | Storage target for media assets (`local` or `gcs`) | `local` |
| `SMTP_HOST` | SMTP server host for system email notifications | `smtp.ethereal.email` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP authentication user | `user@example.com` |
| `SMTP_PASS` | SMTP authentication password | `password` |
| `FACEBOOK_APP_ID` | Facebook Developer App ID | `your_facebook_app_id` |
| `FACEBOOK_APP_SECRET` | Facebook Developer App Secret | `your_facebook_app_secret` |
| `TWITTER_API_KEY` | X / Twitter Developer API Key | `your_twitter_api_key` |
| `LINKEDIN_CLIENT_ID` | LinkedIn Developer Client ID | `your_linkedin_client_id` |
| `GOOGLE_CLIENT_ID` | Google / YouTube OAuth Client ID | `your_google_client_id` |

*(Refer to [`.env.example`](.env.example) for a complete list of platform keys).*

---

## 🗄️ Database & Demo Mode

SocialFlow is engineered to work reliably in two modes:

1. **Full Database Mode (PostgreSQL)**:
   - When a valid `DATABASE_URL` is provided, SocialFlow connects to PostgreSQL using Sequelize, automatically syncs database models, and persists user accounts, scheduled posts, media attachments, and analytics history.
2. **Demo Mode (Zero-Config)**:
   - If PostgreSQL is not detected or fails to connect, SocialFlow falls back gracefully to **Demo Mode**.
   - Demo Mode allows instant exploration of the entire application interface, post creation flows, calendar preview, and analytics dashboard using mock seed data without requiring database setup.

---

## 📡 API Endpoints Overview

SocialFlow exposes a clean REST API interface:

| Category | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register a new user account |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & issue JWT cookie |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user profile |
| **Posts** | `GET` | `/api/auth/demo` | Quick-login with demo account |
| **Posts** | `GET` | `/api/posts` | Fetch posts with status/platform filtering |
| **Posts** | `POST` | `/api/posts` | Create and schedule a new post across platforms |
| **Posts** | `PUT` | `/api/posts/:id` | Update post details or schedule timing |
| **Posts** | `DELETE` | `/api/posts/:id` | Cancel/delete scheduled post |
| **Media** | `GET` | `/api/media` | Fetch media library assets |
| **Media** | `POST` | `/api/media/upload` | Upload & process image/video assets |
| **Media** | `DELETE` | `/api/media/:id` | Delete asset from storage |
| **Platforms**| `GET` | `/api/platforms` | Get connected platforms & account statuses |
| **Platforms**| `GET` | `/api/platforms/:platform/connect` | Initiate OAuth authentication flow |
| **Analytics**| `GET` | `/api/analytics/overview` | Fetch aggregate metrics & platform reach |
| **Analytics**| `GET` | `/api/analytics/charts` | Fetch time-series chart data for Recharts |

---

## 🐳 Docker & Cloud Deployment

### Local Docker Build

SocialFlow includes a lightweight `Dockerfile` based on `node:20-slim` with system FFmpeg installed:

```bash
# Build the Docker image
docker build -t socialflow .

# Run the container
docker run -p 3000:8080 --env-file .env socialflow
```

### Deploying to Google Cloud Run

```bash
# Submit build to Google Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/socialflow

# Deploy container service to Cloud Run
gcloud run deploy socialflow \
  --image gcr.io/YOUR_PROJECT_ID/socialflow \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

---

## 📜 Available npm Scripts

In the project root directory, you can run:

- `npm run dev`: Starts Express server and Vite React app concurrently in watch mode.
- `npm run server`: Starts Express server independently using Node's native file watcher (`node --watch`).
- `npm run client`: Launches Vite React development client on port 3001.
- `npm run build`: Compiles production build of the Vite React frontend into `client/dist`.
- `npm start`: Runs production server (`node server/index.js`).
- `npm run seed`: Populates database with sample users, posts, media, and analytics records.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p center>
  Made with ❤️ for content creators & social media managers.
</p>
