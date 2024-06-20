import fs from "fs";
import path from "path";
import { cleanText, longTextToAudio } from "./audiobooking";
const { convert } = require("html-to-text");

// Format the HTML text and tell it what to skip

const htmlFile = path.resolve(
  "./audiobooking/text-inputs/example.html" // <-------- Your HTML goes here
);
const html = fs.readFileSync(htmlFile, "utf-8");
const conversionOptions = {
  uppercase: false,
  ignoreHref: true,
  wordwrap: false,
  selectors: [
    // {selector: "h2", format: "lowercase"},
    { selector: "sup", format: "skip" },
    { selector: ".code-block", format: "skip" },
    { selector: ".topics", format: "skip" },
    { selector: "audio", format: "skip" },
    { selector: ".author", format: "skip" },
    { selector: ".mdp-speaker-wrapper", format: "skip" },
    { selector: ".references", format: "skip" },
    { selector: ".floating-ref-link", format: "skip" },
    { selector: "table", format: "skip" },
    { selector: ".note", format: "skip" },
    { selector: "hr", format: "skip" },
  ],
};
let text = convert(html, conversionOptions);
text = cleanText(text);
console.log(text);

// Generate your long form audio ----------------

longTextToAudio("example", //name the file output
  text, {
  batchSize: 50, // how many calls per minute go to the API (to avoid rate limits)
  delay: 60000, // you can wait longer than a minute if needed
  voice: "onyx",
});