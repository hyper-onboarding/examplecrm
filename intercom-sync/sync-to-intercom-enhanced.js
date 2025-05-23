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
  IMAGE_BASE_URL: 'https://twenty.com',
  DRY_RUN: process.env.DRY_RUN === 'true',
  DEBUG: process.env.DEBUG === 'true'
};

// Progress tracking
const stats = {
  collectionsCreated: 0,
  collectionsFound: 0,
  articlesCreated: 0,
  articlesFailed: 0,
  startTime: Date.now()
};

// Validate configuration
if (!CONFIG.INTERCOM_API_TOKEN && !CONFIG.DRY_RUN) {
  console.error('Error: INTERCOM_API_TOKEN environment variable is required');
  console.error('Usage: INTERCOM_API_TOKEN="your-token" node sync-to-intercom.js');
  console.error('Or use DRY_RUN=true for testing without API calls');
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
    this.existingArticles = new Map();
  }

  async makeRequest(method, endpoint, body = null) {
    if (CONFIG.DRY_RUN) {
      console.log(`[DRY RUN] ${method} ${endpoint}`);
      if (body && CONFIG.DEBUG) {
        console.log('[DRY RUN] Body:', JSON.stringify(body, null, 2));
      }
      // Return mock data for dry run
      return this.getMockResponse(method, endpoint, body);
    }

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

  getMockResponse(method, endpoint, body) {
    // Mock responses for dry run mode
    if (endpoint === '/me') {
      return { id: '123', name: 'Test User', email: 'test@example.com' };
    }
    if (endpoint === '/help_center/collections' && method === 'GET') {
      return { data: [] };
    }
    if (endpoint === '/help_center/collections' && method === 'POST') {
      return { id: Math.random().toString(), name: body.name };
    }
    if (endpoint === '/articles' && method === 'GET') {
      return { data: [] };
    }
    if (endpoint === '/articles' && method === 'POST') {
      return { id: Math.random().toString(), title: body.title };
    }
    return {};
  }

  async getCurrentAdmin() {
    console.log('📋 Fetching current admin user...');
    return await this.makeRequest('GET', '/me');
  }

  async createCollection(name, description) {
    console.log(`📁 Creating collection: ${name}`);
    stats.collectionsCreated++;
    return await this.makeRequest('POST', '/help_center/collections', {
      name,
      description
    });
  }

  async listCollections() {
    console.log('🔍 Fetching existing collections...');
    const response = await this.makeRequest('GET', '/help_center/collections');
    return response.data || [];
  }

  async createArticle(articleData) {
    console.log(`📝 Creating article: ${articleData.title}`);
    try {
      const result = await this.makeRequest('POST', '/articles', articleData);
      stats.articlesCreated++;
      return result;
    } catch (error) {
      stats.articlesFailed++;
      throw error;
    }
  }

  async listExistingArticles() {
    console.log('🔍 Fetching existing articles...');
    let allArticles = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.makeRequest('GET', `/articles?page=${page}&per_page=50`);
      const articles = response.data || [];
      allArticles = allArticles.concat(articles);

      hasMore = articles.length === 50;
      page++;
    }

    // Create a map for quick lookup
    allArticles.forEach(article => {
      this.existingArticles.set(article.title, article);
    });

    console.log(`Found ${allArticles.length} existing articles`);
    return allArticles;
  }

  async updateArticle(articleId, articleData) {
    console.log(`🔄 Updating article: ${articleData.title}`);
    return await this.makeRequest('PUT', `/articles/${articleId}`, articleData);
  }
}

// Enhanced MDX processing with better error handling
async function parseMDXFile(filePath) {
  const { remark } = await import('remark');
  const { default: html } = await import('remark-html');

  if (CONFIG.DEBUG) {
    console.log(`🔍 Parsing: ${filePath}`);
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    // Convert markdown to HTML with error handling
    let htmlContent;
    try {
      const processedContent = await remark()
        .use(html)
        .process(body);
      htmlContent = processedContent.toString();
    } catch (error) {
      console.error(`Error processing markdown for ${filePath}:`, error);
      htmlContent = `<p>Error processing content</p>`;
    }

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

    // Handle internal links - convert to Twenty documentation URLs
    htmlContent = htmlContent.replace(
      /href="(\/user-guide\/[^"]+)"/g,
      `href="${CONFIG.IMAGE_BASE_URL}$1"`
    );

    // Handle ArticleLink components
    htmlContent = htmlContent.replace(
      /<ArticleLink href="([^"]+)">([^<]+)<\/ArticleLink>/g,
      '<a href="$1" target="_blank" rel="noopener">$2</a>'
    );

    // Handle ArticleEditContent components (remove them)
    htmlContent = htmlContent.replace(/<ArticleEditContent><\/ArticleEditContent>/g, '');

    return {
      title: frontmatter.title || path.basename(filePath, '.mdx'),
      description: frontmatter.info || frontmatter.description || '',
      body: htmlContent,
      metadata: frontmatter,
      filePath
    };
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
    throw error;
  }
}

// Enhanced content discovery with validation
async function discoverContent() {
  const structure = {};
  const contentPath = path.resolve(CONFIG.CONTENT_ROOT);

  console.log(`📂 Scanning content directory: ${contentPath}`);

  try {
    await fs.access(contentPath);
  } catch (error) {
    console.error(`Content directory not found: ${contentPath}`);
    throw error;
  }

  try {
    const items = await fs.readdir(contentPath);

    for (const item of items) {
      const itemPath = path.join(contentPath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        // Check if there's a corresponding index file
        const indexPath = path.join(contentPath, `${item}.mdx`);
        try {
          await fs.access(indexPath);
          const indexData = await parseMDXFile(indexPath);

          // Get all articles in the directory
          const articles = await fs.readdir(itemPath);
          const mdxArticles = articles.filter(f => f.endsWith('.mdx'));

          structure[item] = {
            name: indexData.title,
            description: indexData.description,
            articles: mdxArticles,
            indexData,
            path: itemPath
          };

          console.log(`✅ Found category: ${item} (${mdxArticles.length} articles)`);
        } catch (error) {
          console.warn(`⚠️  No index file for ${item}, skipping...`);
        }
      }
    }
  } catch (error) {
    console.error('Error discovering content:', error);
    throw error;
  }

  return structure;
}

// Print summary
function printSummary() {
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(50));
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Collections created: ${stats.collectionsCreated}`);
  console.log(`📂 Collections found: ${stats.collectionsFound}`);
  console.log(`✅ Articles created: ${stats.articlesCreated}`);
  console.log(`❌ Articles failed: ${stats.articlesFailed}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('='.repeat(50));

  if (CONFIG.DRY_RUN) {
    console.log('\n🔍 This was a DRY RUN - no actual changes were made');
  }
}

// Main sync function with enhanced error handling
async function syncToIntercom() {
  const sync = new IntercomSync();

  console.log('🚀 Starting Intercom Help Center sync...');
  if (CONFIG.DRY_RUN) {
    console.log('🔍 Running in DRY RUN mode - no actual changes will be made\n');
  }

  try {
    // Step 1: Get admin user
    const admin = await sync.getCurrentAdmin();
    console.log(`✅ Authenticated as: ${admin.name} (${admin.email})\n`);

    // Step 2: Get existing collections
    const existingCollections = await sync.listCollections();
    const collectionMap = {};
    existingCollections.forEach(col => {
      collectionMap[col.name] = col;
      stats.collectionsFound++;
    });

    // Step 3: Get existing articles (for update detection)
    if (!CONFIG.DRY_RUN) {
      await sync.listExistingArticles();
    }

    // Step 4: Discover content structure
    const contentStructure = await discoverContent();

    if (Object.keys(contentStructure).length === 0) {
      console.log('⚠️  No content found to sync');
      return;
    }

    // Step 5: Create/update collections and sync articles
    for (const [category, categoryData] of Object.entries(contentStructure)) {
      let collection;

      // Check if collection exists
      if (collectionMap[categoryData.name]) {
        collection = collectionMap[categoryData.name];
        console.log(`\n📂 Using existing collection: ${categoryData.name}`);
      } else {
        // Create new collection
        try {
          collection = await sync.createCollection(
            categoryData.name,
            categoryData.description
          );
          console.log(`\n✅ Created collection: ${categoryData.name}`);
        } catch (error) {
          console.error(`\n❌ Failed to create collection: ${categoryData.name}`);
          console.error(`   Error: ${error.message}`);
          continue;
        }
      }

      // Sync articles in this collection
      for (const articleFile of categoryData.articles) {
        const articlePath = path.join(categoryData.path, articleFile);

        try {
          const articleData = await parseMDXFile(articlePath);

          // Check if article already exists
          const existingArticle = sync.existingArticles.get(articleData.title);

          if (existingArticle) {
            console.log(`  ⏭️  Article already exists: ${articleData.title}`);
            // Optionally update the article here
          } else {
            const article = await sync.createArticle({
              title: articleData.title,
              description: articleData.description,
              body: articleData.body,
              author_id: parseInt(admin.id),
              state: 'published',
              parent_id: parseInt(collection.id),
              parent_type: 'collection'
            });

            console.log(`  ✅ Created article: ${articleData.title}`);
          }
        } catch (error) {
          console.error(`  ❌ Failed to process article: ${articleFile}`);
          console.error(`     Error: ${error.message}`);
          if (CONFIG.DEBUG) {
            console.error(error.stack);
          }
        }
      }
    }

    printSummary();
    console.log('\n✅ Sync completed successfully!');

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    if (CONFIG.DEBUG) {
      console.error(error.stack);
    }
    printSummary();
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  syncToIntercom();
}

module.exports = { syncToIntercom, IntercomSync, parseMDXFile };
