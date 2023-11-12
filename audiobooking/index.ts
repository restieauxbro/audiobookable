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
  return cleanedText.split("\n\n");
}

// Group Paragraphs into Chunks
function groupParagraphs(paragraphs: string[]): string[] {
  let groupedTexts: string[] = [];
  let currentGroup = "";

  paragraphs.forEach((paragraph) => {
    if ((currentGroup + paragraph).length <= 1000) {
      currentGroup += paragraph + "\n";
    } else {
      groupedTexts.push(currentGroup);
      currentGroup = paragraph + "\n";
    }
  });

  if (currentGroup.length > 0) {
    groupedTexts.push(currentGroup);
  }

  groupedTexts = groupedTexts.filter((group) => group.length > 0);
  return groupedTexts;
}

const speechFile = path.resolve("./speech.mp3");

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
async function main() {
  const paragraphs = splitTextIntoParagraphs(harmonTextShort);
  const groupedTexts = groupParagraphs(paragraphs);
  console.log("groupedTexts length", groupedTexts.length);
  // consisting of how mnay characters in each
  console.log(
    "groupedTexts",
    groupedTexts.map((group) => group.length)
  );

  // Use Promise.all with .map to handle all sentences simultaneously
 // const audioBuffers = await Promise.all(groupedTexts.map(getAudioBuffer));

  // Concatenate all audio buffers
  //const combinedBuffer = Buffer.concat(audioBuffers);

  // Write the concatenated buffer to an MP3 file
//  await fs.promises.writeFile(speechFile, combinedBuffer);
}

main();
