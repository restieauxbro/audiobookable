import OpenAI from "openai";
require("dotenv").config();
const openai = new OpenAI();

import fs from "fs";
import path from "path";
//@ts-ignore
import { harmonTextShort } from "./text-inputs/harmonTextShort";

// Helper Function to Clean Text
function cleanText(text: string): string {
  // Implement your text cleaning logic here
  return text;
}

// Split Text into Paragraphs
function splitTextIntoParagraphs(text: string): string[] {
  const cleanedText = cleanText(text);
  // split by two new lines
  return cleanedText.split("\n");
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
  "./audiobooking/audio-outputs/the-prophet-and-the-proletariat.mp3"
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
      voice: "onyx",
      input: paragraph,
    });
    return Buffer.from(await mp3.arrayBuffer());
  } catch (error) {
    throw error;
  }
}

// Main function to process multiple sentences
async function main() {
  const paragraphs = splitTextIntoParagraphs(harmonTextShort);
  console.log("paragraphs length", paragraphs.length);
  const groupedTexts = groupParagraphs(paragraphs);
  console.log("groupedTexts length", groupedTexts.length);
  // consisting of how mnay characters in each
  console.log(
    "groupedTexts",
    groupedTexts.map((group) => group.length)
  );

  let audioBuffers = [];
  for (const group of groupedTexts) {
    const buffer = await getAudioBuffer(group);
    audioBuffers.push(buffer);
  }

  // Concatenate all audio buffers
  const combinedBuffer = Buffer.concat(audioBuffers);

  // Write the concatenated buffer to an MP3 file
  await fs.promises.writeFile(speechFile, combinedBuffer);
}

main();
