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
function deleteAllFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // List all files
            const list = yield openai.files.list();
            // Extract file IDs
            const fileIds = list.data.map(file => file.id);
            // Delete each file
            for (const fileId of fileIds) {
                const deleteResponse = yield openai.files.del(fileId);
                console.log(`Deleted file: ${fileId}`, deleteResponse);
            }
            console.log("All files have been deleted.");
        }
        catch (error) {
            console.error("Error in deleting files: ", error);
        }
    });
}
deleteAllFiles();
