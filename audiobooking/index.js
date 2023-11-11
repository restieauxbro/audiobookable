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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
//@ts-ignore
const audioconcat_1 = __importDefault(require("audioconcat"));
const harmonTextShort_1 = require("./text-inputs/harmonTextShort");
// Helper Function to Clean Text
function cleanText(text) {
    // Implement your text cleaning logic here
    return text;
}
// Split Text into Paragraphs
function splitTextIntoParagraphs(text) {
    const cleanedText = cleanText(text);
    // split by two new lines
    return cleanedText.split("\n\n");
}
// Group Paragraphs into Chunks
function groupParagraphs(paragraphs) {
    let groupedTexts = [];
    let currentGroup = "";
    paragraphs.forEach((paragraph) => {
        if ((currentGroup + paragraph).length <= 4000) {
            currentGroup += paragraph + "\n";
        }
        else {
            groupedTexts.push(currentGroup);
            currentGroup = paragraph + "\n";
        }
    });
    if (currentGroup.length > 0) {
        groupedTexts.push(currentGroup);
    }
    return groupedTexts;
}
// OpenAI TTS Function
function openAITTS(text, fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const mp3 = yield openai.audio.speech.create({
            model: "tts-1",
            voice: "onyx",
            input: text,
        });
        const buffer = Buffer.from(yield mp3.arrayBuffer());
        const speechFile = path_1.default.resolve(`./audiobooking/audio-outputs/${fileName}.mp3`);
        yield fs_1.default.promises.writeFile(speechFile, buffer);
        return speechFile;
    });
}
// Create Audio Transcription
function createAudioTranscription(textGroups, baseFileName) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileNames = [];
        for (let i = 0; i < textGroups.length; i++) {
            const fileName = `${baseFileName}_${i + 2}`;
            const filePath = yield openAITTS(textGroups[i], fileName);
            fileNames.push(filePath);
        }
        return fileNames;
    });
}
// Combine Audio Files using audioconcat
function combineAudioFiles(fileNames, outputFileName) {
    return new Promise((resolve, reject) => {
        (0, audioconcat_1.default)(fileNames)
            .concat(outputFileName)
            .on("start", (command) => {
            console.log("ffmpeg process started:", command);
        })
            .on("error", (err, stdout, stderr) => {
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
(() => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("\n\ntext length in characters: ", harmonTextShort.length);
    const paragraphs = splitTextIntoParagraphs(harmonTextShort_1.harmonTextShort);
    const groupedTexts = groupParagraphs(paragraphs);
    console.log("groupedTexts length: ", groupedTexts[0]);
    const audioFiles = yield createAudioTranscription(groupedTexts.slice(0, 2), "myAudioBook");
    // await combineAudioFiles(
    //   [
    //     "./audiobooking/audio-outputs/myAudioBook_0.mp3",
    //     "./audiobooking/audio-outputs/myAudioBook_1.mp3",
    //   ],
    //   "./audiobooking/audio-outputs/myAudioBook_combined.mp3"
    // );
    console.log("Audio book created successfully!");
}))();
