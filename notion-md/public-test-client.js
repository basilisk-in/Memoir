// public-test-client.js
// Test client that demonstrates how end users would use the API with their own credentials

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

// Test markdown content
const testMarkdown = `# User Test Document

This demonstrates how any user can use this API with their own Notion integration.

## What you need:
1. **Notion API Key** - Get from https://www.notion.so/my-integrations
2. **Database ID or Page ID** - Copy from your Notion URL

## Features Tested:
- [x] Markdown to Notion blocks conversion
- [x] Sending to user's own Notion workspace
- [x] Custom properties and titles

> **Note**: This API doesn't store any user data or API keys!

\`\`\`javascript
// Example usage in your app
const response = await fetch('/convert-and-send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    markdown: '# Hello World',
    databaseId: 'your-database-id',
    title: 'My Document'
  })
});
\`\`\`

---

✨ **Perfect for:**
- Documentation tools
- Note-taking apps
- Content management systems
- Blog publishing workflows`;

async function testWithoutApiKey() {
  console.log('🧪 Testing conversion without API key (public endpoint)...');
  
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
      console.log('💡 This works without any API key - perfect for public use!');
      return data.data;
    } else {
      console.error('❌ Conversion failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testWithUserApiKey(userApiKey, databaseId) {
  console.log('🧪 Testing with user-provided API key...');
  
  if (!userApiKey) {
    console.log('⚠️  No API key provided - skipping Notion integration test');
    console.log('💡 To test with real Notion integration:');
    console.log('   node public-test-client.js YOUR_API_KEY YOUR_DATABASE_ID');
    return;
  }
  
  try {
    // Test 1: Get user's workspace info
    console.log('📋 Getting user workspace information...');
    const workspaceResponse = await fetch(`${API_BASE}/notion-workspace`, {
      headers: {
        'Authorization': `Bearer ${userApiKey}`
      }
    });

    const workspaceData = await workspaceResponse.json();
    
    if (workspaceData.success) {
      console.log('✅ Workspace access successful!');
      console.log(`📄 Found ${workspaceData.data.pages.length} pages`);
      console.log(`🗃️  Found ${workspaceData.data.databases.length} databases`);
      
      // Show first few databases for reference
      if (workspaceData.data.databases.length > 0) {
        console.log('\n📝 Available databases:');
        workspaceData.data.databases.slice(0, 3).forEach(db => {
          console.log(`   • ${db.title} (ID: ${db.id})`);
        });
      }
    }

    // Test 2: Convert and send to Notion
    if (databaseId) {
      console.log('\n🚀 Testing convert-and-send...');
      const sendResponse = await fetch(`${API_BASE}/convert-and-send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdown: testMarkdown,
          databaseId: databaseId,
          title: `API Test - ${new Date().toLocaleString()}`,
          properties: {
            'Status': {
              select: {
                name: 'Published'
              }
            },
            'Tags': {
              multi_select: [
                { name: 'API' },
                { name: 'Test' }
              ]
            }
          }
        })
      });

      const sendData = await sendResponse.json();
      
      if (sendData.success) {
        console.log('✅ Successfully sent to Notion!');
        console.log(`🔗 Page URL: ${sendData.data.url}`);
        console.log(`📄 Page ID: ${sendData.data.pageId}`);
      } else {
        console.error('❌ Failed to send to Notion:', sendData.error);
        if (sendData.help) {
          console.log('💡 Help:', sendData.help);
        }
      }
    } else {
      console.log('⚠️  No database ID provided - skipping send test');
      console.log('💡 Add database ID as second argument to test sending');
    }

  } catch (error) {
    console.error('❌ API key test failed:', error.message);
  }
}

async function demonstrateFlexibleUsage() {
  console.log('\n🎯 API Usage Examples:');
  console.log('\n1️⃣  Convert only (no API key needed):');
  console.log(`   curl -X POST ${API_BASE}/convert \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"markdown": "# Hello World"}'`);
  
  console.log('\n2️⃣  Send to user\'s database:');
  console.log(`   curl -X POST ${API_BASE}/send-to-notion \\`);
  console.log(`     -H "Authorization: Bearer USER_API_KEY" \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"blocks": [...], "databaseId": "USER_DB_ID"}'`);
  
  console.log('\n3️⃣  Convert and send in one step:');
  console.log(`   curl -X POST ${API_BASE}/convert-and-send \\`);
  console.log(`     -H "Authorization: Bearer USER_API_KEY" \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"markdown": "# Content", "databaseId": "USER_DB_ID"}'`);
  
  console.log('\n4️⃣  Get user\'s workspace:');
  console.log(`   curl -H "Authorization: Bearer USER_API_KEY" \\`);
  console.log(`     ${API_BASE}/notion-workspace`);
}

async function runPublicTests() {
  console.log('🌐 Public Notion API Demo');
  console.log('========================\n');
  
  // Test 1: Public conversion (no API key needed)
  await testWithoutApiKey();
  console.log('');
  
  // Test 2: User's own Notion integration
  const userApiKey = process.argv[2];
  const databaseId = process.argv[3];
  
  await testWithUserApiKey(userApiKey, databaseId);
  
  // Show usage examples
  await demonstrateFlexibleUsage();
  
  console.log('\n✨ Benefits of this approach:');
  console.log('   • No API key storage on your server');
  console.log('   • Users control their own data');
  console.log('   • Works with any Notion workspace');
  console.log('   • Scalable for multiple users');
  console.log('   • Convert endpoint works without Notion account');
  
  console.log('\n🔒 Security:');
  console.log('   • API keys sent per request (not stored)');
  console.log('   • Users manage their own integrations');
  console.log('   • No cross-user data access');
  
  console.log('\n🏁 Tests completed!');
}

// Run tests
runPublicTests();
