import fs from "fs";
import path from "path";
import { cleanText, longTextToAudio } from "./audiobooking";
const { convert } = require("html-to-text");

// Format the HTML text and tell it what to skip
const conversionOptions = {
  uppercase: false,
  ignoreHref: true,
  wordwrap: false,
  selectors: [
    // {selector: "h2", format: "lowercase"},
    { selector: "sup", format: "skip" },
    { selector: ".code-block", format: "skip" },
    { selector: ".topics", format: "skip" },
    { selector: "audio", format: "skip" },
    { selector: ".author", format: "skip" },
    { selector: ".mdp-speaker-wrapper", format: "skip" },
    { selector: ".references", format: "skip" },
    { selector: ".floating-ref-link", format: "skip" },
    { selector: "table", format: "skip" },
    { selector: ".note", format: "skip" },
    { selector: "hr", format: "skip" },
  ],
};

// Get all HTML files from the text-inputs folder
const textInputsDir = path.resolve("./audiobooking/text-inputs");
const htmlFiles = fs.readdirSync(textInputsDir)
  .filter(file => file.endsWith('.html'));

console.log(`Found ${htmlFiles.length} HTML files to process`);

// Process each file one by one
async function processAllFiles() {
  for (const htmlFile of htmlFiles.slice(2, 100)) {
    try {
      console.log(`\nProcessing file: ${htmlFile}`);
      
      // Read the HTML file
      const filePath = path.join(textInputsDir, htmlFile);
      const html = fs.readFileSync(filePath, "utf-8");
      
      // Convert HTML to text
      let text = convert(html, conversionOptions);
      text = cleanText(text);
      
      // Generate output filename (without .html extension)
      const outputName = htmlFile.replace('.html', '');
      
      console.log(`Converting "${outputName}" to audio...`);
      
      // Generate audio with gender auto
      await longTextToAudio(
        outputName,
        text, 
        {
          batchSize: 50, // how many calls per minute go to the API (to avoid rate limits)
          delay: 60000, // you can wait longer than a minute if needed
          gender: "auto", // auto-determine gender from author name
          html: html, // pass the HTML to extract author name
        }
      );
      
      console.log(`Completed audio generation for: ${outputName}`);
    } catch (error) {
      console.error(`Error processing file ${htmlFile}:`, error);
    }
  }
  
  console.log("\nAll files have been processed!");
}

// Run the process
processAllFiles().catch(error => {
  console.error("Error in main process:", error);
});