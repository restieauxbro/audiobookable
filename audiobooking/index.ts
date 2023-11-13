import OpenAI from "openai";
require("dotenv").config();
const openai = new OpenAI();
const { convert } = require("html-to-text");
import fs from "fs";
import path from "path";

// get the html file audiobooking/text-inputs/from-marx-to-lenin.html
// and convert it to text
const htmlFile = path.resolve(
  "./audiobooking/text-inputs/from-marx-to-lenin.html"
);
const html = fs.readFileSync(htmlFile, "utf-8");
const conversionOptions = {
  uppercase: false,
  ignoreHref: true,
  wordwrap: false,
  selectors: [
    // {selector: "h2", format: "lowercase"},
    { selector: "sup", format: "skip" },
    { selector: ".code-block", format: "skip" },
    { selector: ".mdp-speaker-wrapper", format: "skip" },
  ],
};
const text = convert(html, conversionOptions);
console.log(cleanText(text));

// Helper Function to Clean Text
function cleanText(text: string): string {
  // remove artifacts like [1], [2], [https://example.com] and so on
  const cleanedText = text
    .replace("https://marxistleftreview.org/subscribe/", "hi there")
    .replace(/\[.*?\]/g, "");
  // remove double spaces
  return cleanedText;
}

// Split Text into Paragraphs
function splitTextIntoParagraphs(text: string): string[] {
  const cleanedText = cleanText(text);
  // split by two new lines
  return cleanedText.split("\n\n");
}

function groupParagraphs(paragraphs: string[]): string[] {
  let groupedTexts: string[] = [];
  let currentGroup = "";

  paragraphs.forEach((paragraph) => {
    // Check the length before appending
    if ((currentGroup + paragraph).length <= 4000) {
      currentGroup += paragraph + "\n";
    } else {
      if (currentGroup.length > 0) {
        groupedTexts.push(currentGroup); // Push the current group if it's not empty
      }
      currentGroup = paragraph + "\n"; // Start a new group with the current paragraph
    }
  });

  // Add the last group if it's not empty
  if (currentGroup.length > 0) {
    groupedTexts.push(currentGroup);
  }

  return groupedTexts.filter((group) => group.length > 0);
}

const speechFile = path.resolve(
  "./audiobooking/audio-outputs/from-lenin-to-marx-debates.mp3"
);

// Function to get audio buffer for a sentence
async function getAudioBuffer(paragraph: string) {
  console.log(
    "\n\ngetting audio for paragraph: ",
    paragraph.slice(0, 100) + "..."
  );
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "fable",
      input: paragraph,
    });
    return Buffer.from(await mp3.arrayBuffer());
  } catch (error) {
    throw error;
  }
}

// Main function to process multiple sentences
async function main() {
  const paragraphs = splitTextIntoParagraphs(text);
  console.log("paragraphs length", paragraphs.length);
  const groupedParagraphs = groupParagraphs(paragraphs);
  console.log("groupedParagraphs length", groupedParagraphs.length);
  // consisting of how many characters in each
  console.log(
    "groupedParagraphs",
    groupedParagraphs.map((group) => group.length)
  );

  let audioBuffers = [];
  const batchSize = 1;
  for (let i = 0; i < groupedParagraphs.length; i += batchSize) {
    const batch = groupedParagraphs.slice(i, i + batchSize);
    const buffers = await Promise.all(batch.map(getAudioBuffer));
    audioBuffers.push(...buffers);
  }

  // Concatenate all audio buffers
  const combinedBuffer = Buffer.concat(audioBuffers);

  // Write the concatenated buffer to an MP3 file
  await fs.promises.writeFile(speechFile, combinedBuffer);
}
main();
