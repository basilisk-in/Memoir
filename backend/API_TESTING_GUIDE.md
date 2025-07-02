# Memoir API Testing Guide

This guide provides comprehensive documentation for testing all API endpoints in the Memoir backend application.

## Base URL
```
http://localhost:8000
```

## Authentication
This API uses Token-based authentication. Most endpoints require authentication except for user registration and login.

### Headers for Authenticated Requests
```
Authorization: Token YOUR_TOKEN_HERE
Content-Type: application/json (for JSON requests)
Content-Type: multipart/form-data (for file uploads)
```

---

## 1. User Authentication Endpoints

### 1.1 User Registration
**Endpoint:** `POST /auth/users/`

**Description:** Create a new user account

**Request Body:**
```json
{
    "username": "testuser",
    "email": "test@example.com",
    "password": "securepassword123",
    "re_password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
    "email": "test@example.com",
    "username": "testuser",
    "id": 1
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/auth/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "securepassword123",
    "re_password": "securepassword123"
  }'
```

### 1.2 User Login (Get Token)
**Endpoint:** `POST /auth/token/login/`

**Description:** Login and get authentication token

**Request Body:**
```json
{
    "username": "testuser",
    "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
    "auth_token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/auth/token/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "securepassword123"
  }'
```

### 1.3 User Logout
**Endpoint:** `POST /auth/token/logout/`

**Description:** Logout and invalidate token

**Headers:**
```
Authorization: Token YOUR_TOKEN_HERE
```

**Response (204 No Content):**
```
(Empty response body)
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/auth/token/logout/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

### 1.4 Get Current User Info
**Endpoint:** `GET /auth/users/me/`

**Description:** Get current authenticated user information

**Headers:**
```
Authorization: Token YOUR_TOKEN_HERE
```

**Response (200 OK):**
```json
{
    "email": "test@example.com",
    "id": 1,
    "username": "testuser"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8000/auth/users/me/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

---

## 2. Note Management Endpoints

### 2.1 Upload Multiple PDF Notes
**Endpoint:** `POST /api/notes/upload/`

**Description:** Upload multiple PDF files with corresponding names. OCR processing happens automatically.

**Headers:**
```
Authorization: Token YOUR_TOKEN_HERE
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: List of PDF files
- `names`: List of corresponding names for each file

**Example using HTML form:**
```html
<form enctype="multipart/form-data">
    <input type="file" name="files" accept=".pdf" multiple>
    <input type="text" name="names" placeholder="Note 1 Name">
    <input type="text" name="names" placeholder="Note 2 Name">
</form>
```

**Response (201 Created):**
```json
[
    {
        "id": 1,
        "name": "Meeting Notes",
        "file": "/media/notes/1/meeting_notes.pdf",
        "file_url": "http://localhost:8000/media/notes/1/meeting_notes.pdf",
        "user": "testuser",
        "uploaded_at": "2025-07-03T10:30:00Z",
        "updated_at": "2025-07-03T10:30:00Z"
    },
    {
        "id": 2,
        "name": "Lecture Notes",
        "file": "/media/notes/1/lecture_notes.pdf",
        "file_url": "http://localhost:8000/media/notes/1/lecture_notes.pdf",
        "user": "testuser",
        "uploaded_at": "2025-07-03T10:30:05Z",
        "updated_at": "2025-07-03T10:30:05Z"
    }
]
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/notes/upload/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b" \
  -F "files=@/path/to/your/file1.pdf" \
  -F "files=@/path/to/your/file2.pdf" \
  -F "names=Meeting Notes" \
  -F "names=Lecture Notes"
```

### 2.2 List All Notes
**Endpoint:** `GET /api/notes/`

**Description:** Get all notes for the authenticated user with pagination

**Headers:**
```
Authorization: Token YOUR_TOKEN_HERE
```

**Query Parameters:**
- `page`: Page number (optional, default: 1)

**Response (200 OK):**
```json
{
    "count": 25,
    "next": "http://localhost:8000/api/notes/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "Meeting Notes",
            "file": "/media/notes/1/meeting_notes.pdf",
            "file_url": "http://localhost:8000/media/notes/1/meeting_notes.pdf",
            "user": "testuser",
            "uploaded_at": "2025-07-03T10:30:00Z",
            "updated_at": "2025-07-03T10:30:00Z"
        }
    ]
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8000/api/notes/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

### 2.3 Get Specific Note Details
**Endpoint:** `GET /api/notes/{note_id}/`

**Description:** Get details of a specific note by ID, including file URL

**Headers:**
```
Authorization: Token YOUR_TOKEN_HERE
```

**Response (200 OK):**
```json
{
    "id": 1,
    "name": "Meeting Notes",
    "file": "/media/notes/1/meeting_notes.pdf",
    "file_url": "http://localhost:8000/media/notes/1/meeting_notes.pdf",
    "user": "testuser",
    "uploaded_at": "2025-07-03T10:30:00Z",
    "updated_at": "2025-07-03T10:30:00Z"
}
```

**Response (404 Not Found):**
```json
{
    "detail": "Not found."
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8000/api/notes/1/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

---

## 3. Search and Filter Endpoints

### 3.1 Get Notes by Date
**Endpoint:** `GET /api/notes/by-date/`

**Description:** Filter notes by upload date

**Headers:**
```
Authorization: Token YOUR_TOKEN_HERE
```

**Query Parameters:**
- `date`: Specific date (YYYY-MM-DD format)
- `start_date`: Start date for range (YYYY-MM-DD format)
- `end_date`: End date for range (YYYY-MM-DD format)

**Examples:**

#### Get notes from a specific date:
```bash
curl -X GET "http://localhost:8000/api/notes/by-date/?date=2025-07-03" \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

#### Get notes from a date range:
```bash
curl -X GET "http://localhost:8000/api/notes/by-date/?start_date=2025-07-01&end_date=2025-07-03" \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

#### Get notes from a start date onwards:
```bash
curl -X GET "http://localhost:8000/api/notes/by-date/?start_date=2025-07-01" \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

**Response (200 OK):**
```json
{
    "count": 5,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "Meeting Notes",
            "file": "/media/notes/1/meeting_notes.pdf",
            "file_url": "http://localhost:8000/media/notes/1/meeting_notes.pdf",
            "user": "testuser",
            "uploaded_at": "2025-07-03T10:30:00Z",
            "updated_at": "2025-07-03T10:30:00Z"
        }
    ]
}
```

### 3.2 Search Notes by Name
**Endpoint:** `GET /api/notes/search/`

**Description:** Search notes by name or filename

**Headers:**
```
Authorization: Token YOUR_TOKEN_HERE
```

**Query Parameters:**
- `q`: General search query (searches in both name and filename)
- `name`: Search specifically in the name field

**Examples:**

#### General search:
```bash
curl -X GET "http://localhost:8000/api/notes/search/?q=meeting" \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

#### Search by name specifically:
```bash
curl -X GET "http://localhost:8000/api/notes/search/?name=lecture" \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

**Response (200 OK):**
```json
{
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "Meeting Notes",
            "file": "/media/notes/1/meeting_notes.pdf",
            "file_url": "http://localhost:8000/media/notes/1/meeting_notes.pdf",
            "user": "testuser",
            "uploaded_at": "2025-07-03T10:30:00Z",
            "updated_at": "2025-07-03T10:30:00Z"
        }
    ]
}
```

---

## 4. OCR and Summary Endpoints

### 4.1 Get OCR Results
**Endpoint:** `GET /api/get-ocr/{note_id}/`

**Description:** Get OCR extracted text from a PDF note. If OCR hasn't been processed, it will be triggered automatically.

**Headers:**
```
Authorization: Token YOUR_TOKEN_HERE
```

**Response (200 OK):**
```json
{
    "id": 1,
    "note": 1,
    "note_name": "Meeting Notes",
    "extracted_text": "--- Page 1 ---\nMeeting Minutes\nDate: July 3, 2025\n\nAttendees:\n- John Doe\n- Jane Smith\n- Bob Johnson\n\nAgenda:\n1. Project updates\n2. Budget review\n3. Next steps\n\n--- Page 2 ---\nProject Updates:\n- Development is on track\n- Testing phase starting next week\n- Deployment scheduled for July 15th",
    "processed_at": "2025-07-03T10:30:10Z"
}
```

**Response (404 Not Found):**
```json
{
    "error": "Note not found"
}
```

**Response (500 Internal Server Error):**
```json
{
    "error": "Failed to process OCR: [error details]"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8000/api/get-ocr/1/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

### 4.2 Get Note Summary
**Endpoint:** `GET /api/get-summary/{note_id}/`

**Description:** Get AI-generated summary of a note. If summary hasn't been generated, it will be created automatically.

**Headers:**
```
Authorization: Token YOUR_TOKEN_HERE
```

**Response (200 OK):**
```json
{
    "id": 1,
    "note": 1,
    "note_name": "Meeting Notes",
    "summary_text": "Summary: Meeting Minutes from July 3, 2025 with attendees John Doe, Jane Smith, and Bob Johnson covering project updates, budget review, and next steps. Development is on track with testing phase starting next week and deployment scheduled for July 15th.\n\nKey Points:\n1. Project updates - Development is on track\n2. Testing phase starting next week\n3. Deployment scheduled for July 15th\n4. Budget review discussed\n5. Next steps outlined\n\nDocument Stats: 45 words, ~1 min read",
    "generated_at": "2025-07-03T10:30:15Z"
}
```

**Response (404 Not Found):**
```json
{
    "error": "Note not found"
}
```

**Response (500 Internal Server Error):**
```json
{
    "error": "Failed to generate summary: [error details]"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8000/api/get-summary/1/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

---

## 5. Regeneration Endpoints

### 5.1 Regenerate OCR
**Endpoint:** `POST /api/regenerate-ocr/{note_id}/`

**Description:** Force regeneration of OCR for a specific note

**Headers:**
```
Authorization: Token YOUR_TOKEN_HERE
```

**Response (200 OK):**
```json
{
    "id": 1,
    "note": 1,
    "note_name": "Meeting Notes",
    "extracted_text": "[Newly processed OCR text...]",
    "processed_at": "2025-07-03T11:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/regenerate-ocr/1/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

### 5.2 Regenerate Summary
**Endpoint:** `POST /api/regenerate-summary/{note_id}/`

**Description:** Force regeneration of summary for a specific note

**Headers:**
```
Authorization: Token YOUR_TOKEN_HERE
```

**Response (200 OK):**
```json
{
    "id": 1,
    "note": 1,
    "note_name": "Meeting Notes",
    "summary_text": "[Newly generated summary...]",
    "generated_at": "2025-07-03T11:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/regenerate-summary/1/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

---

## 6. Error Responses

### Common Error Codes:

#### 400 Bad Request
```json
{
    "field_name": ["Error message describing the validation issue"]
}
```

#### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided."
}
```

#### 403 Forbidden
```json
{
    "detail": "You do not have permission to perform this action."
}
```

#### 404 Not Found
```json
{
    "detail": "Not found."
}
```

#### 500 Internal Server Error
```json
{
    "error": "Detailed error message"
}
```

---

## 7. Testing Workflow

### Complete Testing Sequence:

1. **Register a new user**
2. **Login to get token**
3. **Upload PDF notes**
4. **List all notes**
5. **Get specific note details**
6. **Search notes**
7. **Filter notes by date**
8. **Get OCR results**
9. **Get note summary**
10. **Test regeneration endpoints**
11. **Logout**

### Sample Testing Script (Python):

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# 1. Register user
register_data = {
    "username": "testuser",
    "email": "test@example.com", 
    "password": "securepassword123",
    "re_password": "securepassword123"
}

response = requests.post(f"{BASE_URL}/auth/users/", json=register_data)
print("Register:", response.status_code, response.json())

# 2. Login
login_data = {
    "username": "testuser",
    "password": "securepassword123"
}

response = requests.post(f"{BASE_URL}/auth/token/login/", json=login_data)
token = response.json()["auth_token"]
print("Login token:", token)

headers = {"Authorization": f"Token {token}"}

# 3. Upload notes (requires actual PDF files)
files = {
    'files': ('test.pdf', open('test.pdf', 'rb'), 'application/pdf'),
}
data = {
    'names': 'Test Note'
}

response = requests.post(f"{BASE_URL}/api/notes/upload/", 
                        files=files, data=data, headers=headers)
print("Upload:", response.status_code, response.json())

# 4. List notes
response = requests.get(f"{BASE_URL}/api/notes/", headers=headers)
print("List notes:", response.status_code, response.json())

# 5. Get OCR for note ID 1
response = requests.get(f"{BASE_URL}/api/get-ocr/1/", headers=headers)
print("OCR:", response.status_code, response.json())

# 6. Get summary for note ID 1
response = requests.get(f"{BASE_URL}/api/get-summary/1/", headers=headers)
print("Summary:", response.status_code, response.json())
```

---

## 8. File Upload Notes

### Supported File Types:
- Only PDF files are accepted
- File validation happens on both frontend and backend

### File Size Limits:
- Maximum file size: 10MB per file
- Configured in Django settings: `FILE_UPLOAD_MAX_MEMORY_SIZE`

### File Storage:
- Files are stored in: `media/notes/{user_id}/filename.pdf`
- File URLs are accessible at: `http://localhost:8000/media/notes/{user_id}/filename.pdf`

### OCR Processing:
- Happens automatically on upload (synchronous for proof of concept)
- First tries to extract text directly from PDF
- Falls back to OCR if PDF contains scanned images
- Supports multi-page PDFs

This comprehensive guide covers all the API endpoints and provides examples for testing each functionality. Make sure to start the Django development server (`python manage.py runserver`) before testing these endpoints.
