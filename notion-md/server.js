// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { markdownToBlocks, markdownToRichText } from '@tryfabric/martian';
import { Client } from '@notionhq/client';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Notion client with your API key from .env
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve demo HTML page
app.get('/demo', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'demo.html'));
});

// Serve test HTML page
app.get('/test', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'test.html'));
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Notion Markdown Converter API',
    version: '1.0.0',
    description: 'Convert markdown to Notion blocks and send to any Notion workspace',
    endpoints: {
      '/convert': 'POST - Convert markdown to Notion blocks and rich text',
      '/send-to-notion': 'POST - Send blocks to Notion page (requires user API key)',
      '/convert-and-send': 'POST - Convert and send in one step (requires user API key)',
      '/notion-page/:id': 'GET - Get Notion page content (requires user API key in header)'
    },
    usage: {
      apiKey: 'Include your Notion API key in Authorization header: Bearer YOUR_API_KEY',
      gettingStarted: 'Visit https://www.notion.so/my-integrations to create an integration'
    }
  });
});

// Helper function to create Notion client with user's API key
function createNotionClient(apiKey) {
  if (!apiKey) {
    throw new Error('Notion API key is required. Include it in the Authorization header as "Bearer YOUR_API_KEY"');
  }
  
  // Remove 'Bearer ' prefix if present
  const cleanApiKey = apiKey.replace(/^Bearer\s+/i, '');
  
  return new Client({
    auth: cleanApiKey,
  });
}

// Helper function to extract API key from request
function getApiKeyFromRequest(req) {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return authHeader;
  }
  
  // Check body for apiKey field
  if (req.body && req.body.apiKey) {
    return req.body.apiKey;
  }
  
  // Check query params
  if (req.query && req.query.apiKey) {
    return req.query.apiKey;
  }
  
  return null;
}

// Endpoint 1: Convert markdown to Notion blocks and rich text
app.post('/convert', async (req, res) => {
  try {
    const { markdown, text } = req.body;

    if (!markdown && !text) {
      return res.status(400).json({
        error: 'Either markdown or text field is required'
      });
    }

    const content = markdown || text;

    // Convert to Notion blocks and rich text using Martian
    const blocks = markdownToBlocks(content);
    const richText = markdownToRichText(content);

    res.json({
      success: true,
      data: {
        blocks,
        richText,
        originalContent: content
      }
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      error: 'Failed to convert content',
      details: error.message
    });
  }
});

// Endpoint 2: Send blocks to Notion (simplified - uses your API key)
app.post('/send-to-notion', async (req, res) => {
  try {
    const { blocks, richText, title } = req.body;

    if (!blocks && !richText) {
      return res.status(400).json({
        error: 'Either blocks or richText is required'
      });
    }

    const databaseId = process.env.NOTION_DATABASE_ID;
    
    if (!databaseId) {
      return res.status(500).json({
        error: 'Database ID not configured in .env file'
      });
    }

    // Create new page in your database
    const pageProperties = {
      Name: {
        title: [
          {
            text: {
              content: title || 'API Test Document'
            }
          }
        ]
      }
    };

    const response = await notion.pages.create({
      parent: {
        database_id: databaseId
      },
      properties: pageProperties,
      children: blocks || []
    });

    res.json({
      success: true,
      message: 'Successfully sent to your Notion!',
      data: {
        pageId: response.id,
        url: response.url || `https://notion.so/${response.id.replace(/-/g, '')}`,
        title: title || 'API Test Document'
      }
    });

  } catch (error) {
    console.error('Notion API error:', error);
    res.status(500).json({
      error: 'Failed to send to Notion',
      details: error.message,
      code: error.code
    });
  }
});

// Endpoint 3: Convert and send in one step
app.post('/convert-and-send', async (req, res) => {
  try {
    const { markdown, text, pageId, databaseId, title, properties } = req.body;

    if (!markdown && !text) {
      return res.status(400).json({
        error: 'Either markdown or text field is required'
      });
    }

    let useDatabaseId = databaseId;
    
    if (!pageId && !useDatabaseId) {
      // Use the database ID from .env file
      useDatabaseId = process.env.NOTION_DATABASE_ID;
      
      if (!useDatabaseId) {
        return res.status(400).json({
          error: 'No database ID provided and none configured in .env file'
        });
      }
    }

    const content = markdown || text;

    // Step 1: Convert to Notion blocks
    const blocks = markdownToBlocks(content);
    const richText = markdownToRichText(content);
    let notionResponse;

    if (pageId) {
      notionResponse = await notion.blocks.children.append({
        block_id: pageId,
        children: blocks
      });
    } else if (useDatabaseId) {
      const pageProperties = properties || {};
      
      if (title && !pageProperties.Name && !pageProperties.Title) {
        pageProperties.Name = {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        };
      }

      notionResponse = await notion.pages.create({
        parent: {
          database_id: useDatabaseId
        },
        properties: pageProperties,
        children: blocks
      });
    }

    res.json({
      success: true,
      data: {
        blocks,
        richText,
        notionResponse,
        pageId: notionResponse.id,
        url: notionResponse.url || `https://notion.so/${notionResponse.id.replace(/-/g, '')}`
      }
    });

  } catch (error) {
    console.error('Convert and send error:', error);
    res.status(500).json({
      error: 'Failed to convert and send to Notion',
      details: error.message
    });
  }
});

// Endpoint 4: Get Notion page content
app.get('/notion-page/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;

    const apiKey = getApiKeyFromRequest(req);
    const notion = createNotionClient(apiKey);

    const page = await notion.pages.retrieve({ page_id: pageId });
    const blocks = await notion.blocks.children.list({ block_id: pageId });

    res.json({
      success: true,
      data: {
        page,
        blocks: blocks.results
      }
    });

  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({
      error: 'Failed to retrieve Notion page',
      details: error.message
    });
  }
});

// Endpoint 5: Get user's accessible pages and databases
app.get('/notion-workspace', async (req, res) => {
  try {
    const apiKey = getApiKeyFromRequest(req);
    const notion = createNotionClient(apiKey);

    // Get user's accessible pages and databases
    const search = await notion.search({
      filter: {
        value: 'page',
        property: 'object'
      },
      page_size: 20
    });

    const databases = await notion.search({
      filter: {
        value: 'database',
        property: 'object'
      },
      page_size: 20
    });

    res.json({
      success: true,
      data: {
        pages: search.results.map(page => ({
          id: page.id,
          title: page.properties?.title?.title?.[0]?.text?.content || 'Untitled',
          url: page.url,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time
        })),
        databases: databases.results.map(db => ({
          id: db.id,
          title: db.title?.[0]?.text?.content || 'Untitled Database',
          url: db.url,
          created_time: db.created_time,
          last_edited_time: db.last_edited_time,
          properties: Object.keys(db.properties || {})
        }))
      }
    });

  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({
      error: 'Failed to retrieve workspace information',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   GET  /                       - API information`);
  console.log(`   POST /convert                - Convert markdown to Notion blocks`);
  console.log(`   POST /send-to-notion         - Send blocks to Notion (requires API key)`);
  console.log(`   POST /convert-and-send       - Convert and send in one step (requires API key)`);
  console.log(`   GET  /notion-page/:id        - Get Notion page content (requires API key)`);
  console.log(`   GET  /notion-workspace       - Get user's pages and databases (requires API key)`);
  console.log(`   GET  /demo                   - Demo HTML interface`);
  console.log(`\n💡 Usage:`);
  console.log(`   - No API key needed for /convert endpoint`);
  console.log(`   - Include Notion API key in Authorization header: Bearer YOUR_API_KEY`);
  console.log(`   - Get API key from: https://www.notion.so/my-integrations`);
});

export default app;
