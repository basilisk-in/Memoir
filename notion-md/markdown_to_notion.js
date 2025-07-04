// // only blocks(text)
// import { markdownToBlocks } from "@tryfabric/martian";
// import fs from "fs";

// const inputPath = process.argv[2];
// const md = fs.readFileSync(inputPath, "utf8");

// const blocks = markdownToBlocks(md);
// console.log(JSON.stringify(blocks, null, 2));

//both richtext and blocks
import { markdownToBlocks, markdownToRichText } from "@tryfabric/martian";
import fs from "fs";

const inputPath = process.argv[2];
const md = fs.readFileSync(inputPath, "utf8");

const blocks = markdownToBlocks(md);
const richText = markdownToRichText(md);

// Output both as JSON (or separated by newline, etc)
console.log(JSON.stringify({ blocks, richText }, null, 2));

