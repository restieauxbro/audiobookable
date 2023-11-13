import fs from "fs";
import path from "path";
require("dotenv").config();
import OpenAI from "openai";

const openai = new OpenAI();

const speechFile = path.resolve("./audiobooking/audio-outputs/speech-6.mp3");

async function main() {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: "onyx",
    input: `Just 18 months into its term and Labor is starting to wobble. While Albo’s victory halo lasted longer than might have been expected, the situation has now clearly turned. Frustration with Labor’s inadequate policies has now decisively replaced hostility to Morrison and the former Liberal government in the public’s consciousness. A broad sense of malaise has crept in, colouring almost everything the government does.
\n\n
    The overwhelming factor in all this is the assault on living standards that has gone on under Labor’s watch. Inflation has hit Australian workers hard, with incomes falling sharply when adjusted for inflation. The situation is much worse than the data shows, since the official cost of living metrics do not include the soaring cost of mortgage repayments due to higher interest rates. The resulting scenario of consistently falling living standards is unprecedented in modern Australian working-class history, where workers have steadily improved their living conditions in the 32 years since the last recession, albeit at increasingly slow rates.`,
  });
  console.log(speechFile);
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}
main();
