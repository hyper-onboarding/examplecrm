#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
// const { remark } = require('remark'); // Changed to dynamic import
// const html = require('remark-html'); // Changed to dynamic import
const fetch = require('node-fetch');

// Configuration
const CONFIG = {
  INTERCOM_API_TOKEN: process.env.INTERCOM_API_TOKEN,
  INTERCOM_API_VERSION: '2.13',
  BASE_URL: 'https://api.intercom.io',
  CONTENT_ROOT: '../packages/twenty-website/src/content/user-guide',
  IMAGE_BASE_URL: 'https://twenty.com'
};

// Validate token is provided
if (!CONFIG.INTERCOM_API_TOKEN) {
  console.error('Error: INTERCOM_API_TOKEN environment variable is required');
  console.error('Usage: INTERCOM_API_TOKEN="your-token" node sync-to-intercom.js');
  process.exit(1);
}

class IntercomSync {
  constructor() {
    this.headers = {
      'Authorization': `Bearer ${CONFIG.INTERCOM_API_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Intercom-Version': CONFIG.INTERCOM_API_VERSION
    };
  }

  async makeRequest(method, endpoint, body = null) {
    const options = {
      method,
      headers: this.headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${CONFIG.BASE_URL}${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error.message);
      throw error;
    }
  }

  async getCurrentAdmin() {
    console.log('Fetching current admin user...');
    return await this.makeRequest('GET', '/me');
  }

  async createCollection(name, description) {
    console.log(`Creating collection: ${name}`);
    return await this.makeRequest('POST', '/help_center/collections', {
      name,
      description
    });
  }

  async listCollections() {
    console.log('Fetching existing collections...');
    const response = await this.makeRequest('GET', '/help_center/collections');
    return response.data || [];
  }

  async createArticle(articleData) {
    console.log(`Creating article: ${articleData.title}`);
    return await this.makeRequest('POST', '/articles', articleData);
  }

  async updateArticle(articleId, articleData) {
    console.log(`Updating article: ${articleData.title}`);
    return await this.makeRequest('PUT', `/articles/${articleId}`, articleData);
  }

  async listArticles() {
    console.log('Fetching existing articles...');
    const response = await this.makeRequest('GET', '/articles');
    return response.data || [];
  }
}

// MDX/Markdown processing
async function parseMDXFile(filePath) {
  const { remark } = await import('remark');
  const { default: html } = await import('remark-html');

  console.log(`Parsing: ${filePath}`);
  const content = await fs.readFile(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  // Convert markdown to HTML
  const processedContent = await remark()
    .use(html)
    .process(body);

  let htmlContent = processedContent.toString();

  // Convert relative image paths to absolute URLs
  htmlContent = htmlContent.replace(
    /src="(\/images\/[^"]+)"/g,
    `src="${CONFIG.IMAGE_BASE_URL}$1"`
  );

  // Handle markdown image syntax
  htmlContent = htmlContent.replace(
    /!\[([^\]]*)\]\((\/images\/[^)]+)\)/g,
    `<img alt="$1" src="${CONFIG.IMAGE_BASE_URL}$2" />`
  );

  // Handle ArticleLink components
  htmlContent = htmlContent.replace(
    /<ArticleLink href="([^"]+)">([^<]+)<\/ArticleLink>/g,
    '<a href="$1" target="_blank" rel="noopener">$2</a>'
  );

  // Handle ArticleEditContent components (remove them as they're Twenty-specific)
  htmlContent = htmlContent.replace(/<ArticleEditContent><\/ArticleEditContent>/g, '');

  return {
    title: frontmatter.title || path.basename(filePath, '.mdx'),
    description: frontmatter.info || frontmatter.description || '',
    body: htmlContent,
    metadata: frontmatter
  };
}

// Content discovery
async function discoverContent() {
  const structure = {};
  const contentPath = path.resolve(CONFIG.CONTENT_ROOT);

  try {
    const items = await fs.readdir(contentPath);

    for (const item of items) {
      const itemPath = path.join(contentPath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        // Check if there's a corresponding index file
        const indexPath = path.join(contentPath, `${item}.mdx`);
        try {
          const indexData = await parseMDXFile(indexPath);

          // Get all articles in the directory
          const articles = await fs.readdir(itemPath);
          const mdxArticles = articles.filter(f => f.endsWith('.mdx'));

          structure[item] = {
            name: indexData.title,
            description: indexData.description,
            articles: mdxArticles,
            indexData
          };
        } catch (error) {
          console.warn(`No index file for ${item}, skipping...`);
        }
      }
    }
  } catch (error) {
    console.error('Error discovering content:', error);
  }

  return structure;
}

// Main sync function
async function syncToIntercom() {
  const sync = new IntercomSync();

  try {
    // Step 1: Get admin user
    const admin = await sync.getCurrentAdmin();
    console.log(`Authenticated as: ${admin.name} (${admin.email})`);

    // Step 2: Get existing collections
    const existingCollections = await sync.listCollections();
    const collectionMap = {};
    existingCollections.forEach(col => {
      collectionMap[col.name] = col;
    });

    // Step 3: Discover content structure
    const contentStructure = await discoverContent();
    console.log('\nContent structure discovered:');
    Object.entries(contentStructure).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value.articles.length} articles`);
    });

    // Step 4: Create/update collections and sync articles
    for (const [category, categoryData] of Object.entries(contentStructure)) {
      let collection;

      // Check if collection exists
      if (collectionMap[categoryData.name]) {
        collection = collectionMap[categoryData.name];
        console.log(`\nUsing existing collection: ${categoryData.name}`);
      } else {
        // Create new collection
        collection = await sync.createCollection(
          categoryData.name,
          categoryData.description
        );
        console.log(`\nCreated collection: ${categoryData.name}`);
      }

      // Sync articles in this collection
      for (const articleFile of categoryData.articles) {
        const articlePath = path.join(CONFIG.CONTENT_ROOT, category, articleFile);
        const articleData = await parseMDXFile(articlePath);

        try {
          const article = await sync.createArticle({
            title: articleData.title,
            description: articleData.description,
            body: articleData.body,
            author_id: parseInt(admin.id),
            state: 'published',
            parent_id: parseInt(collection.id),
            parent_type: 'collection'
          });

          console.log(`  ✓ Created article: ${articleData.title}`);
        } catch (error) {
          console.error(`  ✗ Failed to create article: ${articleData.title}`);
          console.error(`    Error: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Sync completed successfully!');

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  console.log('🚀 Starting Intercom Help Center sync...\n');
  syncToIntercom();
}

module.exports = { syncToIntercom, IntercomSync, parseMDXFile };
