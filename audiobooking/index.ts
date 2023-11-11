import OpenAI from "openai";
require("dotenv").config();
const openai = new OpenAI();

import fs from "fs";
import path from "path";
//@ts-ignore
import audioconcat from "audioconcat";
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
    if ((currentGroup + paragraph).length <= 4000) {
      currentGroup += paragraph + "\n";
    } else {
      groupedTexts.push(currentGroup);
      currentGroup = paragraph + "\n";
    }
  });

  if (currentGroup.length > 0) {
    groupedTexts.push(currentGroup);
  }

  return groupedTexts
}

// OpenAI TTS Function
async function openAITTS(text: string, fileName: string): Promise<string> {
  console.log(text)
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "onyx",
    input: text,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  const speechFile = path.resolve(
    `./audiobooking/audio-outputs/${fileName}.mp3`
  );
  await fs.promises.writeFile(speechFile, buffer);
  return speechFile;
}

// Create Audio Transcription
async function createAudioTranscription(
  textGroups: string[],
  baseFileName: string
): Promise<string[]> {
  let fileNames: string[] = [];

  for (let i = 0; i < textGroups.length; i++) {
    const fileName = `${baseFileName}_${i}`;
    const filePath = await openAITTS(textGroups[i], fileName);
    fileNames.push(filePath);
  }

  return fileNames;
}

// Combine Audio Files using audioconcat
function combineAudioFiles(
  fileNames: string[],
  outputFileName: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    audioconcat(fileNames)
      .concat(outputFileName)
      .on("start", (command: string) => {
        console.log("ffmpeg process started:", command);
      })
      .on("error", (err: Error, stdout: string, stderr: string) => {
        console.error("Error:", err);
        console.error("ffmpeg stderr:", stderr);
        reject(err);
      })
      .on("end", () => {
        console.log("Audio concatenation finished");
        resolve();
      });
  });
}

// Example Usage
(async () => {
  // console.log("\n\ntext length in characters: ", harmonTextShort.length);
  const paragraphs = splitTextIntoParagraphs(harmonTextShort);
  const groupedTexts = groupParagraphs(paragraphs)
  console.log("groupedTexts ", groupedTexts[3]);

  // const audioFiles = await createAudioTranscription(
  //   groupedTexts,
  //   "myAudioBook"
  // );
  // await combineAudioFiles(
  //   [
  //     "./audiobooking/audio-outputs/myAudioBook_0.mp3",
  //     "./audiobooking/audio-outputs/myAudioBook_1.mp3",
  //   ],
  //   "./audiobooking/audio-outputs/myAudioBook_combined.mp3"
  // );
  console.log("Audio book created successfully!");
})();
