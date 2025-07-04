// convert.js
import { markdownToBlocks, markdownToRichText } from '@tryfabric/martian';
import fs from 'fs';

// Read markdown from a file (example.md)
const markdown = fs.readFileSync('example.md', 'utf8');

// Convert to Notion blocks
const blocks = markdownToBlocks(markdown);
const richText = markdownToRichText(markdown);

// Save outputs to JSON
fs.writeFileSync('blocks.json', JSON.stringify(blocks, null, 2));
fs.writeFileSync('richtext.json', JSON.stringify(richText, null, 2));

console.log('✅ Markdown converted to Notion JSON (blocks.json & richtext.json)');
