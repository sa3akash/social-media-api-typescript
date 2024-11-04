import { BadRequestError } from '@globals/helpers/errorHandler';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

interface LinkPreviewMetadata {
  title: string;
  description: string;
  lang: string;
  author: string | null;
  publisher: string;
  url: string;
  logo: MediaData | null;
  image: MediaData | null;
  domain: string;
}

interface MediaData {
  url: string;
  type: string;
}

export class LinkPreviewController {
  public async getLinkMetadata(req: Request, res: Response) {
    const url = req.query.url as string;
    if (!url) {
      throw new BadRequestError('Missing URL parameter');
    }

    let metadata;
    if (url.includes('linkedin.com')) {
      // Use Puppeteer for LinkedIn URLs
      metadata = await LinkPreviewController.prototype.fetchMetadataWithPuppeteer(url);
    } else {
      // Use axios and Cheerio for other URLs
      const { data: html } = await axios.get(url);
      metadata = LinkPreviewController.prototype.extractMetadataWithCheerio(html, url);
    }

    // Include domain in response
    metadata.domain = new URL(url).hostname;

    res.status(HTTP_STATUS.OK).json(metadata);
  }

  // Fetch metadata using Puppeteer for LinkedIn links
  private async fetchMetadataWithPuppeteer(url: string): Promise<LinkPreviewMetadata> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const content = await page.content();
    await browser.close();

    return LinkPreviewController.prototype.extractMetadataWithCheerio(content, url);
  }

  // Extract metadata using Cheerio
  private extractMetadataWithCheerio(html: string, url: string): LinkPreviewMetadata {
    const $ = cheerio.load(html);

    // Try to get OpenGraph metadata first
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'No title available';
    const description =
      $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || 'No description available';
    const image = $('meta[property="og:image"]').attr('content') || $('meta[name="image"]').attr('content') || null;
    const lang = $('html').attr('lang') || 'en';
    const author = $('meta[name="author"]').attr('content') || null;
    const publisher = $('meta[property="og:site_name"]').attr('content') || $('meta[name="publisher"]').attr('content') || 'Unknown';

    // LinkedIn specific extraction
    const linkedInDescription =
      $('meta[name="description"]').attr('content') || $('div[class*="description"]').text().trim() || 'No description available';
    const linkedInImage = $('meta[property="og:image"]').attr('content') || $('img').first().attr('src') || null;

    // Handle logo (e.g., favicon)
    const logo = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || null;
    const formattedLogo = logo ? (logo.startsWith('http') ? logo : `${url}${logo}`) : null;

    // Create final metadata object
    
    return {
      title: title || 'No title available',
      description: description || linkedInDescription || 'No description available',
      lang,
      author,
      publisher: publisher || 'Unknown',
      url,
      logo: formattedLogo ? { url: formattedLogo, type: formattedLogo.split('.').pop() || '' } : null,
      image: image ? { url: image|| linkedInImage!, type: image?.split('.')?.pop() || '' } : null,
      domain: new URL(url).hostname
    };
  }
}
