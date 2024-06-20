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
  voice: "onyx", // select a voice model (e.g., "onyx", "lutana", etc.)
});
```
4. Run the script using the provided npm script: `npm run createAudiobook`

This will convert your long-form text into an audiobook and save it as an MP3 file.

### Configuration Options

* `batchSize`: Adjust the number of API calls made per minute to avoid rate limits.
* `delay`: Adjust the delay between API calls (in milliseconds).
* `voice`: Select a voice model for the audiobook (e.g., "onyx", "lutana", etc.).

### Contributions and Feedback

Contributions, bug reports, and feedback are welcome! Please open an issue or submit a pull request to help improve Audiobookable.