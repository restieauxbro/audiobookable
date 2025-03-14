# Audiobookable

Convert Long-Form Text to Audiobooks with Node.js

**Introduction**

Audiobookable is a TypeScript Node.js script that converts long-form text into audiobooks, a capability lacking in popular Text-to-Speech (TTS) providers. This script utilizes the OpenAI API to synthesize audio from text inputs, then combines the outputs into a single MP3 file.

**Getting Started**

### Prerequisites

* Node.js installed on your system
* TypeScript installed globally (`npm install -g typescript`)

### Installation

1. Clone this repository: `git clone https://github.com/your-username/audiobookable.git`
2. Install dependencies: `npm install`

### Configuration

Before running the script, create a `.env` file in the root directory with your OpenAI API key:
```
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
```
Replace `YOUR_OPENAI_API_KEY_HERE` with your actual OpenAI API key.

### Usage

1. Create a new HTML file with your long-form text content and place it in the `audiobooking/text-inputs` directory.
2. In `index.ts`, locate the HTML file by updating the `htmlFile` variable:
```typescript
const htmlFile = path.resolve("./audiobooking/text-inputs/example.html"); // Update with your HTML file
```
3. Update the `longTextToAudio` function call with your desired output filename, text content, and other options:
```typescript
longTextToAudio("example",  // output filename
  text, {
  batchSize: 50, // adjust API call batch size to avoid rate limits
  delay: 60000, // adjust delay between API calls (in milliseconds)
  // voice: "onyx", // uncomment to specify a particular voice
  gender: "auto", // automatically determine gender from author name
  html: html, // pass the HTML to extract author name
});
```
4. Run the script using the provided npm script: `npm run createAudiobook`

This will convert your long-form text into an audiobook and save it as an MP3 file.

### Configuration Options

* `batchSize`: Adjust the number of API calls made per minute to avoid rate limits.
* `delay`: Adjust the delay between API calls (in milliseconds).
* `voice`: Select a voice model for the audiobook (e.g., "onyx", "echo", "fable", "alloy", "nova" or "shimmer").
* `gender`: Select a gender for the voice ("male", "female", or "auto"). When set to "auto", the system will attempt to determine the author's gender from their name using AI. This is used only when no specific voice is provided. Male voices include "onyx", "echo", and "fable". Female voices include "alloy", "nova", and "shimmer".
* `html`: The original HTML content, required when using gender="auto" to extract the author's name.

### Contributions and Feedback

Contributions, bug reports, and feedback are welcome! Please open an issue or submit a pull request to help improve Audiobookable.