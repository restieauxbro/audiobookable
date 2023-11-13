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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
require("dotenv").config();
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default();
const speechFile = path_1.default.resolve("./audiobooking/audio-outputs/speech-6.mp3");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const mp3 = yield openai.audio.speech.create({
            model: "tts-1-hd",
            voice: "onyx",
            input: `Just 18 months into its term and Labor is starting to wobble. While Albo’s victory halo lasted longer than might have been expected, the situation has now clearly turned. Frustration with Labor’s inadequate policies has now decisively replaced hostility to Morrison and the former Liberal government in the public’s consciousness. A broad sense of malaise has crept in, colouring almost everything the government does.
\n\n
    The overwhelming factor in all this is the assault on living standards that has gone on under Labor’s watch. Inflation has hit Australian workers hard, with incomes falling sharply when adjusted for inflation. The situation is much worse than the data shows, since the official cost of living metrics do not include the soaring cost of mortgage repayments due to higher interest rates. The resulting scenario of consistently falling living standards is unprecedented in modern Australian working-class history, where workers have steadily improved their living conditions in the 32 years since the last recession, albeit at increasingly slow rates.`,
        });
        console.log(speechFile);
        const buffer = Buffer.from(yield mp3.arrayBuffer());
        yield fs_1.default.promises.writeFile(speechFile, buffer);
    });
}
main();
