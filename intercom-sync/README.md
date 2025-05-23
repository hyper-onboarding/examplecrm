# Twenty to Intercom Help Center Sync

This tool automatically syncs your Twenty website user guide content (MDX files) to your Intercom Help Center.

## Features

- 🔄 Syncs MDX content to Intercom articles
- 📁 Preserves folder structure as collections
- 🖼️ Automatically converts image paths to absolute URLs
- ✨ Converts MDX/Markdown to Intercom-compatible HTML
- 🔍 Handles custom components (ArticleLink, etc.)
- ✅ Creates or updates existing content

## Prerequisites

- Node.js >= 14.0.0
- An Intercom account with Help Center access
- An Intercom access token with article management permissions

## Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Set up your environment:
```bash
# Create a .env file
echo "INTERCOM_API_TOKEN=your_token_here" > .env
```

## Usage

### Basic Sync

```bash
# Using environment variable
INTERCOM_API_TOKEN="your_token_here" npm run sync

# Or if you have a .env file
npm run sync
```

### Dry Run (Preview without making changes)

```bash
npm run sync:dry-run
```

## How It Works

1. **Content Discovery**: Scans the `../packages/twenty-website/src/content/user-guide` directory
2. **Collection Mapping**: Creates Intercom collections for each top-level category
3. **Article Creation**: Converts MDX files to HTML and creates articles in Intercom
4. **Image Handling**: Converts relative image paths to absolute URLs (https://twenty.com/...)

### Content Structure

```
user-guide/
├── getting-started.mdx          # Collection index
├── getting-started/             # Collection folder
│   ├── what-is-twenty.mdx      # Article
│   └── create-workspace.mdx    # Article
├── objects.mdx                  # Collection index
├── objects/                     # Collection folder
│   └── ...                     # Articles
└── ...
```

Maps to Intercom as:
- Collections: "Getting Started", "Objects", etc.
- Articles: Individual MDX files within each folder

## Configuration

Edit the configuration in `sync-to-intercom-enhanced.js`:

```javascript
const CONFIG = {
  INTERCOM_API_TOKEN: process.env.INTERCOM_API_TOKEN,
  INTERCOM_API_VERSION: '2.13',
  BASE_URL: 'https://api.intercom.io',
  CONTENT_ROOT: '../packages/twenty-website/src/content/user-guide',
  IMAGE_BASE_URL: 'https://twenty.com'
};
```

## Security

⚠️ **Important Security Notes:**
- Never commit your API token to version control
- Use environment variables or secure secret management
- Rotate tokens regularly
- Keep tokens server-side only

## Troubleshooting

### Common Issues

1. **Authentication Error (401)**
   - Check your API token is valid
   - Ensure the token has the necessary permissions

2. **Rate Limiting (429)**
   - The script includes automatic retry logic
   - For large imports, consider running in batches

3. **Missing Images**
   - Ensure images are deployed to https://twenty.com
   - Check image paths in your MDX files

### Debug Mode

For verbose logging, set:
```bash
DEBUG=true INTERCOM_API_TOKEN="..." npm run sync
```

## Extending the Script

### Adding Custom Component Handlers

Edit the `parseMDXFile` function to handle additional components:

```javascript
// Handle custom component
htmlContent = htmlContent.replace(
  /<YourComponent ([^>]+)>([^<]+)<\/YourComponent>/g,
  (match, props, content) => {
    // Your transformation logic
    return `<div>${content}</div>`;
  }
);
```

### Incremental Updates

To implement incremental updates, you can:
1. Store article IDs after creation
2. Compare file timestamps
3. Update only changed articles

## License

This sync tool follows the same license as the Twenty project.
