# Notion Markdown Converter API

A Node.js/Express.js API for converting markdown to Notion blocks and rich text using Martian, and sending them to any user's Notion workspace. **Perfect for public APIs** - users provide their own API keys and database IDs.

## 🌟 Key Features

- **No API key storage** - Users provide their own Notion API keys per request
- **Public conversion endpoint** - Convert markdown without any Notion account
- **Multi-user support** - Works with any Notion workspace
- **Secure** - No cross-user data access
- **Flexible** - Send to databases or pages, with custom properties

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Start the server:**
```bash
npm start
# or for development
npm run dev
```

3. **Test without Notion (public endpoint):**
```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello World\n\nThis is **bold** text."}'
```

## 📋 API Endpoints

### 1. Convert Markdown (Public - No API Key Required)
**POST** `/convert`

Convert markdown text to Notion blocks and rich text format.

```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello World\n\nThis is **bold** text."}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "blocks": [...],
    "richText": [...],
    "originalContent": "..."
  }
}
```

### 2. Send to User's Notion
**POST** `/send-to-notion`

Send blocks to any user's Notion workspace using their API key.

```bash
curl -X POST http://localhost:3000/send-to-notion \
  -H "Authorization: Bearer USER_NOTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "blocks": [...],
    "databaseId": "USER_DATABASE_ID",
    "title": "My Document",
    "properties": {
      "Status": {"select": {"name": "Published"}}
    }
  }'
```

### 3. Convert and Send (One Step)
**POST** `/convert-and-send`

Convert markdown and send to Notion in one request.

```bash
curl -X POST http://localhost:3000/convert-and-send \
  -H "Authorization: Bearer USER_NOTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# My Document\n\nContent here...",
    "databaseId": "USER_DATABASE_ID",
    "title": "My New Page"
  }'
```

### 4. Get User's Workspace
**GET** `/notion-workspace`

Get user's accessible pages and databases.

```bash
curl -H "Authorization: Bearer USER_NOTION_API_KEY" \
  http://localhost:3000/notion-workspace
```

### 5. Get Notion Page
**GET** `/notion-page/:pageId`

Retrieve content from a Notion page.

```bash
curl -H "Authorization: Bearer USER_NOTION_API_KEY" \
  http://localhost:3000/notion-page/PAGE_ID
```

## 🔑 How Users Get Their API Keys

1. **Create Notion Integration:**
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Give it a name and select workspace
   - Copy the "Internal Integration Token"

2. **Share Pages/Databases:**
   - Open the target page/database in Notion
   - Click "Share" → "Invite"
   - Select your integration
   - Grant appropriate permissions

3. **Get Database/Page IDs:**
   - Database ID: From URL `notion.so/database-id?v=...`
   - Page ID: From URL `notion.so/page-id`

## 💡 Integration Examples

### Frontend JavaScript
```javascript
// Convert markdown (no API key needed)
const convertMarkdown = async (markdown) => {
  const response = await fetch('http://localhost:3000/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown })
  });
  return response.json();
};

// Send to user's Notion
const sendToNotion = async (blocks, userApiKey, databaseId) => {
  const response = await fetch('http://localhost:3000/send-to-notion', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      blocks,
      databaseId,
      title: 'My Document'
    })
  });
  return response.json();
};
```

### React Component Example
```jsx
import { useState } from 'react';

function NotionPublisher() {
  const [markdown, setMarkdown] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');

  const handlePublish = async () => {
    try {
      const response = await fetch('/convert-and-send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdown,
          databaseId,
          title: 'Published via API'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Published! View at: ${result.data.url}`);
      }
    } catch (error) {
      alert('Failed to publish: ' + error.message);
    }
  };

  return (
    <div>
      <textarea 
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        placeholder="Write your markdown here..."
      />
      <input 
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Your Notion API Key"
      />
      <input 
        value={databaseId}
        onChange={(e) => setDatabaseId(e.target.value)}
        placeholder="Database ID"
      />
      <button onClick={handlePublish}>
        Publish to Notion
      </button>
    </div>
  );
}
```

## 🔒 Security & Privacy

- **No API key storage**: Keys are only used per request, never stored
- **User-controlled**: Each user manages their own Notion integration
- **No cross-contamination**: Users can only access their own workspaces
- **Stateless**: Server doesn't maintain user sessions or data

## 🌐 Perfect For

- **Documentation tools** - Let users publish to their Notion
- **Content management** - Convert and sync content to Notion
- **Note-taking apps** - Backup notes to user's Notion workspace
- **Blog publishing** - Multi-platform publishing workflows
- **Team tools** - Each team uses their own Notion workspace

## 🚦 Error Handling

The API provides helpful error messages:

```json
{
  "error": "Integration not authorized for this resource",
  "details": "...",
  "help": {
    "solution": "Share the target page/database with your integration in Notion"
  }
}
```

Common errors and solutions:
- **Invalid API key**: Check your integration token
- **Object not found**: Ensure page/database exists and is shared
- **Unauthorized**: Share the resource with your integration

## 📦 Deployment

### Environment Variables (Optional)
```bash
PORT=3000  # Server port
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Railway/Vercel/Heroku
1. Connect your GitHub repo
2. Set PORT environment variable
3. Deploy - that's it!

## 🧪 Testing

```bash
# Test conversion only (no API key needed)
npm run test:convert

# Test with your Notion API key
npm run test:notion YOUR_API_KEY YOUR_DATABASE_ID

# Run all tests
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with different Notion workspaces
5. Submit a pull request

## 📄 License

MIT License - feel free to use in your projects!
