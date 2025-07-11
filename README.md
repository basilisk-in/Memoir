# Memoir
Your Notes, Smarter.

## Project Idea
Memoir is an AI-powered note management platform that lets users upload, organize, and summarize their PDF and image notes. Leveraging advanced OCR and LLM-based Markdown generation, Memoir automatically extracts text from documents and produces rich, structured summaries. Users can search, filter, and manage their notes, and even export summaries to Notion for seamless knowledge management.

Team Name:

██████╗░░█████╗░░██████╗██╗██╗░░░░░██╗░██████╗██╗░░██╗
██╔══██╗██╔══██╗██╔════╝██║██║░░░░░██║██╔════╝██║░██╔╝
██████╦╝███████║╚█████╗░██║██║░░░░░██║╚█████╗░█████═╝░
██╔══██╗██╔══██║░╚═══██╗██║██║░░░░░██║░╚═══██╗██╔═██╗░
██████╦╝██║░░██║██████╔╝██║███████╗██║██████╔╝██║░╚██╗
╚═════╝░╚═╝░░╚═╝╚═════╝░╚═╝╚══════╝╚═╝╚═════╝░╚═╝░░╚═╝

Team Members:
- [@debrup27](https://github.com/debrup27)
- [@raunaksaigal](https://github.com/raunaksaigal)
- [@kantandesu](https://github.com/kantandesu)
- [@sagnik-tech56](https://github.com/sagnik-tech56)


### 🛠️ Tech Stack
**Frontend**: React (Vite, TailwindCSS, React Router)

**Backend**: Django, Django REST Framework, Djoser, SQLite, PaddleOCR, PyMuPDF, pdfplumber, LLM (remote Markdown server)

**AI/ML**: PaddleOCR for text extraction, LLM (Mistral-7B) for Markdown summarization (served remotely)

**Integrations**: Notion API


### Key Features
- 📄 **Multi-file Upload**: Upload multiple PDF/image notes at once with custom names.
- 🔍 **OCR Extraction**: Automatic text extraction from PDFs and images using PaddleOCR and PyMuPDF.
- 🧠 **AI Summarization**: Generate rich Markdown summaries using a remote LLM server.
- 🗂️ **Note Management**: Search, filter, and organize notes by name or date.
- 🔗 **Notion Export**: Export AI-generated summaries directly to your Notion workspace.
- 👤 **User Authentication**: Secure registration, login, and token-based auth (Djoser).
- 🖼️ **File Previews**: View uploaded notes and summaries in the web UI.
- 🌗 **Dark/Light Mode**: Toggle between light and dark themes.

### 🏗️ Architecture
1. **Django REST API Server**
   - Handles user authentication, note uploads, OCR, and summary generation
   - Exposes REST endpoints for all note and user operations
   - Integrates with a remote LLM server for Markdown summary generation
   - Stores files in /media/notes/{user_id}/
2. **React Frontend (Vite)**
   - Modern SPA for uploading, viewing, and managing notes
   - Authenticates via token-based API
   - Provides UI for Notion integration and document export
   - Responsive, accessible, and themeable
3. **Remote LLM Server (not included here)**
   - Receives text and returns Markdown summaries via HTTP
   - Powered by Mistral-7B or similar model

## 🚀 Quick Start
### Prerequisites
- Python 3.10+
- Node.js 18+
- pip, npm
- (Linux: poppler-utils, libjpeg, zlib, etc. — see below)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # Runs on http://localhost:8000
```

### Frontend Setup
```bash
cd memoir_website
npm install
npm run dev  # Runs on http://localhost:5173
```

### Environment Variables
Create a `.env` file in `backend/` with:
```
REMOTE_MARKDOWN_SERVER_URL=https://your-llm-server-url
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_secret
FRONTEND_URL=http://localhost:5173
```

### System Dependencies
- poppler-utils (for pdf2image)
- libjpeg, zlib (for PyMuPDF, Pillow)
- paddlepaddle or paddlepaddle-gpu (for PaddleOCR)

### File Storage
- Uploaded files: `backend/media/notes/{user_id}/filename.pdf`
- Static files: `backend/static/`

## 📡 API Endpoints
See [backend/API_TESTING_GUIDE.md](backend/API_TESTING_GUIDE.md) for full details. Key endpoints:

#### Authentication
- `POST /auth/users/` — Register
- `POST /auth/token/login/` — Login
- `POST /auth/token/logout/` — Logout
- `GET /auth/users/me/` — Current user info

#### Notes
- `POST /api/notes/upload/` — Upload multiple notes
- `GET /api/notes/` — List notes
- `GET /api/notes/{id}/` — Note details
- `GET /api/notes/by-date/` — Filter by date
- `GET /api/notes/search/` — Search notes

#### OCR & Summaries
- `GET /api/get-ocr/{note_id}/` — Get OCR text
- `GET /api/get-summary/{note_id}/` — Get AI summary
- `POST /api/regenerate-ocr/{note_id}/` — Force OCR
- `POST /api/regenerate-summary/{note_id}/` — Force summary

#### Notion Integration
- `POST /api/notion/authorize/` — Start Notion OAuth
- `POST /api/notion/callback/` — Handle Notion callback
- `GET /api/notion/status/` — Get Notion integration status
- `POST /api/notion/export/{note_id}/` — Export summary to Notion
- `DELETE /api/notion/disconnect/` — Disconnect Notion

## 🧪 Testing
- Use the [API_TESTING_GUIDE.md](backend/API_TESTING_GUIDE.md) for cURL and Python examples
- All endpoints require authentication except registration/login
- File uploads use `multipart/form-data`

### 💾 Database Models
- **Note**: User, name, file, timestamps
- **OCRResult**: One-to-one with Note, extracted text
- **NoteSummary**: One-to-one with Note, AI-generated summary
- **NotionIntegration**: User, access token, workspace info

### 🧠 AI/ML Pipeline
- **OCR**: On upload, PDFs/images are processed with PyMuPDF and PaddleOCR
- **Summarization**: Extracted text is sent to a remote LLM server, which returns a Markdown summary
- **Notion Export**: Summaries can be exported to Notion as structured blocks

### 🖥️ Frontend Features
- Modern React SPA (Vite, TailwindCSS)
- Components: Upload, MyDocuments, NotionIntegration, SignInModal, ThemeToggle, etc.
- Custom hooks: useAuth, useTheme, useScrollAnimation
- API integration via `src/services/api.js`
- Responsive and accessible UI

## 📎 Resources / Credits
- PaddleOCR: https://github.com/PaddlePaddle/PaddleOCR
- PyMuPDF: https://github.com/pymupdf/PyMuPDF
- Mistral-7B: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF
- Notion API: https://developers.notion.com/

## 🏁 Final Words
Memoir brings together OCR, AI, and modern web tech to make your notes searchable, summarized, and exportable. Whether you're a student, researcher, or professional, Memoir helps you get more value from your documents.
