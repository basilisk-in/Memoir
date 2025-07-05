// test-client.js
// Simple test client to demonstrate API usage

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

// Test markdown content
const testMarkdown = `# My Test Document

This is a **bold** paragraph with some *italic* text and a [link](https://example.com).

## Features List

- First bullet point
- Second bullet point with **bold** text
- [x] Completed task
- [ ] Incomplete task

> This is a quote block with some important information.

\`\`\`javascript
console.log("Hello, Notion!");
const data = { message: "This is a code block" };
\`\`\`

### Table Example

| Name | Age | City |
|------|-----|------|
| John | 25  | NYC  |
| Jane | 30  | LA   |

---

That's all for now!`;

async function testConvert() {
  console.log('🧪 Testing /convert endpoint...');
  
  try {
    const response = await fetch(`${API_BASE}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        markdown: testMarkdown
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Conversion successful!');
      console.log(`📦 Generated ${data.data.blocks.length} blocks`);
      console.log(`📝 Generated ${data.data.richText.length} rich text elements`);
      
      // Save outputs for inspection
      await import('fs').then(fs => {
        fs.writeFileSync('test-blocks.json', JSON.stringify(data.data.blocks, null, 2));
        fs.writeFileSync('test-richtext.json', JSON.stringify(data.data.richText, null, 2));
        console.log('💾 Saved test-blocks.json and test-richtext.json');
      });
      
      return data.data;
    } else {
      console.error('❌ Conversion failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testSendToNotion(blocks, databaseId) {
  console.log('🧪 Testing /send-to-notion endpoint...');
  
  if (!databaseId) {
    console.log('⚠️  Skipping Notion test - no database ID provided');
    console.log('💡 To test Notion integration:');
    console.log('   1. Set NOTION_API_KEY in .env');
    console.log('   2. Add your database ID as second argument');
    console.log('   3. Run: node test-client.js your-database-id');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/send-to-notion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocks: blocks,
        databaseId: databaseId,
        title: `Test Document - ${new Date().toLocaleString()}`,
        properties: {
          'Status': {
            select: {
              name: 'Draft'
            }
          }
        }
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Successfully sent to Notion!');
      console.log(`🔗 Page URL: ${data.data.url}`);
      console.log(`📄 Page ID: ${data.data.pageId}`);
    } else {
      console.error('❌ Failed to send to Notion:', data.error);
    }
  } catch (error) {
    console.error('❌ Notion test failed:', error.message);
  }
}

async function testConvertAndSend(databaseId) {
  console.log('🧪 Testing /convert-and-send endpoint...');
  
  if (!databaseId) {
    console.log('⚠️  Skipping convert-and-send test - no database ID provided');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/convert-and-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        markdown: '# Quick Test\n\nThis is a **one-step** conversion and send test!',
        databaseId: databaseId,
        title: `Quick Test - ${new Date().toLocaleString()}`
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Convert-and-send successful!');
      console.log(`🔗 Page URL: ${data.data.url}`);
    } else {
      console.error('❌ Convert-and-send failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Convert-and-send test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  // Test 1: Convert markdown
  const convertResult = await testConvert();
  console.log('');
  
  // Get database ID from command line args
  const databaseId = process.argv[2];
  
  if (convertResult && convertResult.blocks) {
    // Test 2: Send to Notion
    await testSendToNotion(convertResult.blocks, databaseId);
    console.log('');
    
    // Test 3: Convert and send in one step
    await testConvertAndSend(databaseId);
  }
  
  console.log('🏁 Tests completed!');
}

// Run tests
runTests();
