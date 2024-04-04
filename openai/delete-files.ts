import OpenAI from "openai";
require("dotenv").config();

const openai = new OpenAI();

async function deleteAllFiles() {
  try {
    // List all files
    const list = await openai.files.list();

    // Extract file IDs
    const fileIds = list.data.map(file => file.id);

    // Delete each file
    for (const fileId of fileIds) {
      const deleteResponse = await openai.files.del(fileId);
      console.log(`Deleted file: ${fileId}`, deleteResponse);
    }

    console.log("All files have been deleted.");
  } catch (error) {
    console.error("Error in deleting files: ", error);
  }
}

deleteAllFiles();