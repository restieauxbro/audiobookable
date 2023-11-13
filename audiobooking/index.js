"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
require("dotenv").config();
const openai = new openai_1.default();
const { convert } = require("html-to-text");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// get the html file audiobooking/text-inputs/from-marx-to-lenin.html
// and convert it to text
const htmlFile = path_1.default.resolve("./audiobooking/text-inputs/from-marx-to-lenin.html");
const html = fs_1.default.readFileSync(htmlFile, "utf-8");
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
function cleanText(text) {
    // remove artifacts like [1], [2], [https://example.com] and so on
    const cleanedText = text
        .replace("https://marxistleftreview.org/subscribe/", "hi there")
        .replace(/\[.*?\]/g, "");
    // remove double spaces
    return cleanedText;
}
// Split Text into Paragraphs
function splitTextIntoParagraphs(text) {
    const cleanedText = cleanText(text);
    // split by two new lines
    return cleanedText.split("\n\n");
}
function groupParagraphs(paragraphs) {
    let groupedTexts = [];
    let currentGroup = "";
    paragraphs.forEach((paragraph) => {
        // Check the length before appending
        if ((currentGroup + paragraph).length <= 4000) {
            currentGroup += paragraph + "\n";
        }
        else {
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
const speechFile = path_1.default.resolve("./audiobooking/audio-outputs/from-lenin-to-marx-debates.mp3");
// Function to get audio buffer for a sentence
function getAudioBuffer(paragraph) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("\n\ngetting audio for paragraph: ", paragraph.slice(0, 100) + "...");
        try {
            const mp3 = yield openai.audio.speech.create({
                model: "tts-1-hd",
                voice: "fable",
                input: paragraph,
            });
            return Buffer.from(yield mp3.arrayBuffer());
        }
        catch (error) {
            throw error;
        }
    });
}
// Main function to process multiple sentences
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const paragraphs = splitTextIntoParagraphs(text);
        console.log("paragraphs length", paragraphs.length);
        const groupedParagraphs = groupParagraphs(paragraphs);
        console.log("groupedParagraphs length", groupedParagraphs.length);
        // consisting of how many characters in each
        console.log("groupedParagraphs", groupedParagraphs.map((group) => group.length));
        let audioBuffers = [];
        const batchSize = 1;
        for (let i = 0; i < groupedParagraphs.length; i += batchSize) {
            const batch = groupedParagraphs.slice(i, i + batchSize);
            const buffers = yield Promise.all(batch.map(getAudioBuffer));
            audioBuffers.push(...buffers);
        }
        // Concatenate all audio buffers
        const combinedBuffer = Buffer.concat(audioBuffers);
        // Write the concatenated buffer to an MP3 file
        yield fs_1.default.promises.writeFile(speechFile, combinedBuffer);
    });
}
main();
