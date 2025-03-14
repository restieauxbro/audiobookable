import OpenAI from "openai";
require("dotenv").config();
const openai = new OpenAI();
import fs from "fs";
import path from "path";

type Voice =
  | "onyx" // men's voices
  | "echo"
  | "fable"
  | "alloy" // women's voices
  | "nova"
  | "shimmer";

type Gender = "male" | "female" | "auto";

// Helper Function to Clean Text
export function cleanText(text: string): string {
  // remove artifacts like [1], [2], [https://example.com] and so on
  let cleanedText = text.replace(/\[.*?\]/g, "");
  // remove everything after the last occurrence of "REFERENCES"
  cleanedText = cleanedText.replace(/REFERENCES[\s\S]*$/, "");
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

const speechFile = (outputFileName: string) => {
  const outputDir = path.resolve('./audiobooking/audio-outputs');
  // Create the directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return path.resolve(outputDir, `${outputFileName}.mp3`);
}

// Function to extract author name from HTML
async function extractAuthorName(html: string): Promise<string | null> {
  try {
    // Look for author in a span with class "author"
    const authorMatch = html.match(/<span class="author">(.*?)<\/span>/);
    if (authorMatch && authorMatch[1]) {
      // Clean up the author name (remove "By", etc.)
      return authorMatch[1].replace(/^By\s+/i, '').trim();
    }
    return null;
  } catch (error) {
    console.error("Error extracting author name:", error);
    return null;
  }
}

// Function to determine gender using OpenAI
async function determineGender(authorName: string): Promise<Gender> {
  if (!authorName) return "male"; // Default to male if no author name

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that determines the likely gender of a person based on their name. Respond with only 'male' or 'female'."
        },
        {
          role: "user",
          content: `What is the likely gender of the author named "${authorName}"? Respond with only 'male' or 'female'.`
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    const result = response.choices[0].message.content?.toLowerCase().trim();
    
    if (result === "male" || result === "female") {
      console.log(`Determined gender for "${authorName}": ${result}`);
      return result as Gender;
    }
    
    // Default to male if response is not valid
    console.log(`Could not determine gender for "${authorName}", defaulting to male`);
    return "male";
  } catch (error) {
    console.error("Error determining gender:", error);
    return "male"; // Default to male on error
  }
}

// Function to get audio buffer for a sentence
async function getAudioBuffer(paragraph: string, voice?: Voice) {
  console.log(
    "\n\ngetting audio for paragraph: ",
    paragraph.slice(0, 100) + "..."
  );
  try {
    // Use the provided voice or default to "onyx"
    const selectedVoice: Voice = voice || "onyx";
    
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: selectedVoice,
      input: paragraph,
    });
    return Buffer.from(await mp3.arrayBuffer());
  } catch (error) {
    throw error;
  }
}

// Main function to process multiple sentences
export async function longTextToAudio(
  outputFileName: string,
  text: string,
  options: {
    batchSize?: number;
    delay?: number;
    voice?: Voice;
    gender?: Gender;
    html?: string; // Add HTML parameter to extract author name
  }
) {
  const { batchSize, delay, voice, gender, html } = options;
  
  // Determine the gender to use
  let genderToUse: Gender = gender || "male";
  
  // If gender is 'auto' and no voice is specified, determine gender from author name
  if (gender === "auto" && !voice && html) {
    const authorName = await extractAuthorName(html);
    if (authorName) {
      console.log(`Found author name: ${authorName}`);
      genderToUse = await determineGender(authorName);
    } else {
      console.log("No author name found, defaulting to male gender");
      genderToUse = "male";
    }
  }
  
  // Select a consistent voice for the entire article based on gender
  let selectedVoice: Voice | undefined = voice;
  if (!selectedVoice) {
    const maleVoices: Voice[] = ["onyx", "echo", "fable"];
    const femaleVoices: Voice[] = ["alloy", "nova", "shimmer"];
    
    if (genderToUse === "male") {
      selectedVoice = maleVoices[Math.floor(Math.random() * maleVoices.length)];
    } else if (genderToUse === "female") {
      selectedVoice = femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
    } else {
      selectedVoice = "onyx"; // Default fallback
    }
    console.log(`Selected voice for entire article: ${selectedVoice}`);
  }
  
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
    const buffers = await Promise.all(
      batch.map((str) => getAudioBuffer(str, selectedVoice))
    );
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