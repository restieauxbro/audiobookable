import OpenAI from "openai";
require("dotenv").config();
const openai = new OpenAI();
const { convert } = require("html-to-text");
import fs from "fs";
import path from "path";

const conversionOptions = {
  uppercase: false,
  ignoreHref: true,
  wordwrap: false,
  selectors: [
    // {selector: "h2", format: "lowercase"},
    { selector: "sup", format: "skip" },
    { selector: ".code-block", format: "skip" },
    { selector: ".mdp-speaker-wrapper", format: "skip" },
    { selector: ".references", format: "skip" },
    { selector: ".floating-ref-link", format: "skip" },
  ],
};

// Helper Function to Clean Text
function cleanText(text: string): string {
  // remove artifacts like [1], [2], [https://example.com] and so on
  const cleanedText = text.replace(/\[.*?\]/g, "");
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
      currentGroup += paragraph + "\n\n";
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

const speechFile = (outputFileName: string) =>
  path.resolve(`./audiobooking/audio-outputs/${outputFileName}.mp3`);

// Function to get audio buffer for a sentence
async function getAudioBuffer(paragraph: string) {
  console.log(
    "\n\ngetting audio for paragraph: ",
    paragraph.slice(0, 100) + "..."
  );
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx",
      input: paragraph,
    });
    return Buffer.from(await mp3.arrayBuffer());
  } catch (error) {
    throw error;
  }
}

// Main function to process multiple sentences
async function main(
  outputFileName: string,
  batchSize?: number,
  delay?: number
) {
  const paragraphs = splitTextIntoParagraphs(text);
  console.log("paragraphs length", paragraphs.length);
  const groupedParagraphs = groupParagraphs(paragraphs);
  console.log("groupedParagraphs length", groupedParagraphs.length);
  // consisting of how many characters in each
  console.log(
    "groupedParagraphs",
    groupedParagraphs.map((group) => group.length)
  );

  // Send requests in batches of 3 every minute to avoid rate limit
  let audioBuffers: Buffer[] = [];
  const batchMax = batchSize || 3;
  const batchDelay = delay || 0;

  for (let i = 0; i < groupedParagraphs.length; i += batchMax) {
    const batch = groupedParagraphs.slice(i, i + batchMax);
    const buffers = await Promise.all(batch.map(getAudioBuffer));
    audioBuffers.push(...buffers);
    if (i + batchMax < groupedParagraphs.length) {
      // waiting until the previous batch is done before starting the next one
      // to ensure that the audio buffers are in the correct order
      console.log(
        `waiting ${batchDelay / 1000} seconds before sending next batch`
      );
      await new Promise((resolve) => setTimeout(resolve, batchDelay));
    }
  }

  // Concatenate all audio buffers
  const combinedBuffer = Buffer.concat(audioBuffers);

  // Write the concatenated buffer to an MP3 file
  await fs.promises.writeFile(speechFile(outputFileName), combinedBuffer);
}

const htmlFile = path.resolve(
  "./audiobooking/text-inputs/Israel, the US, and imperialism.html"
);
const html = fs.readFileSync(htmlFile, "utf-8");
const text = convert(html, conversionOptions);
console.log(cleanText(text));

main("Israel the US and imperialism-HD", 20, 60000);
