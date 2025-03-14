import * as puppeteer from 'puppeteer';
import * as fs from 'fs-extra';
import * as path from 'path';

// Define interfaces for article data
interface ArticleMetadata {
  title: string;
  url: string;
  author: string;
  date: string;
  tags: string[];
}

interface Article extends ArticleMetadata {
  content: string;
}

/**
 * Extracts article links from the Marxist Left Review homepage
 * @param page Puppeteer page object
 * @returns Array of article URLs
 */
async function extractArticleLinks(page: puppeteer.Page): Promise<string[]> {
  await page.goto('https://marxistleftreview.org/', { waitUntil: 'networkidle2' });
  
  // Extract all article links using the selector we identified
  const articleLinks = await page.evaluate(() => {
    const linkElements = document.querySelectorAll('.post-preview h2 a');
    return Array.from(linkElements).map((a: Element) => (a as HTMLAnchorElement).href);
  });
  
  return articleLinks;
}

/**
 * Extracts article content from a specific article page
 * @param page Puppeteer page object
 * @param url URL of the article to scrape
 * @returns Article object with metadata and content
 */
async function extractArticleContent(page: puppeteer.Page, url: string): Promise<Article> {
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Extract article data using page.evaluate
  const article = await page.evaluate(() => {
    // Extract title
    const title = document.querySelector('.article-header h1')?.textContent?.trim() || 'Untitled Article';
    
    // Extract author
    const authorElement = document.querySelector('.author a');
    const author = authorElement?.textContent?.trim() || 'Unknown Author';
    
    // Extract date
    const dateText = document.querySelector('.author')?.textContent?.trim() || '';
    const dateMatch = dateText.match(/Published\s+(\d+\s+\w+\s+\d{4})/);
    const date = dateMatch ? dateMatch[1] : 'Unknown Date';
    
    // Extract tags
    const tagElements = document.querySelectorAll('.topics a');
    const tags = Array.from(tagElements).map((tag: Element) => {
      const text = tag.textContent?.trim() || '';
      return text.startsWith('#') ? text.substring(1) : text;
    });
    
    // Extract content
    const contentElement = document.querySelector('.rich-text');
    let content = '';
    
    if (contentElement) {
      // Clone the content element to avoid modifying the original
      const contentClone = contentElement.cloneNode(true) as HTMLElement;
      
      // Remove any unwanted elements (like ads, navigation, etc.)
      const unwantedSelectors = ['.code-block', '.mdp-speaker-wrapper'];
      unwantedSelectors.forEach(selector => {
        const elements = contentClone.querySelectorAll(selector);
        elements.forEach((el: Element) => el.parentNode?.removeChild(el));
      });
      
      content = contentClone.innerHTML;
    }
    
    return { title, author, date, tags, content };
  });
  
  return { ...article, url };
}

/**
 * Formats article data as clean HTML
 * @param article Article object
 * @returns Formatted HTML string
 */
function formatArticleAsHtml(article: Article): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${article.title}</title>
</head>
<body>
  <h1>${article.title}</h1>
  <div class="article-content">
    ${article.content}
  </div>
</body>
</html>`;
}

/**
 * Generates a filename from an article URL
 * @param url Article URL
 * @returns Safe filename
 */
function generateFilename(url: string): string {
  // Extract the slug from the URL
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/').filter(Boolean);
  const slug = pathSegments[pathSegments.length - 1] || 'article';
  
  // Ensure the filename is safe and add .html extension
  return `${slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.html`;
}

/**
 * Main function to scrape articles from Marxist Left Review
 * @param outputDir Directory to save HTML files
 * @param limit Optional limit on number of articles to scrape
 */
export async function scrapeArticles(
  outputDir: string = path.join(__dirname, '../../audiobooking/text-inputs'),
  limit?: number
): Promise<void> {
  console.log(`Starting article scraping process...`);
  console.log(`Output directory: ${outputDir}`);
  
  // Ensure output directory exists
  await fs.ensureDir(outputDir);
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Extract article links
    console.log('Extracting article links from homepage...');
    const articleLinks = await extractArticleLinks(page);
    console.log(`Found ${articleLinks.length} articles`);
    
    // Apply limit if specified
    const linksToProcess = limit ? articleLinks.slice(0, limit) : articleLinks;
    
    // Process each article
    for (let i = 0; i < linksToProcess.length; i++) {
      const url = linksToProcess[i];
      console.log(`Processing article ${i + 1}/${linksToProcess.length}: ${url}`);
      
      try {
        // Extract article content
        const article = await extractArticleContent(page, url);
        
        // Format as HTML
        const html = formatArticleAsHtml(article);
        
        // Generate filename
        const filename = generateFilename(url);
        const filePath = path.join(outputDir, filename);
        
        // Save to file
        await fs.writeFile(filePath, html, 'utf8');
        console.log(`Saved article to ${filePath}`);
      } catch (error) {
        console.error(`Error processing article ${url}:`, error);
      }
    }
    
    console.log('Article scraping completed successfully!');
  } catch (error) {
    console.error('Error during article scraping:', error);
    throw error;
  } finally {
    // Close browser
    await browser.close();
  }
}

// When run directly (via script)
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  
  scrapeArticles(path.join(__dirname, '../../audiobooking/text-inputs'), limit)
    .then(() => console.log('Scraping completed successfully'))
    .catch(err => {
      console.error('Error during scraping:', err);
      process.exit(1);
    });
} 