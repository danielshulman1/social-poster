/**
 * Post Parser
 * Parse uploaded files (.txt, .csv) containing social media posts
 */

/**
 * Parse uploaded file content
 * Handles both .txt and .csv formats
 */
export async function parsePostFile(fileContent, fileName) {
  try {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      return parseCSVPosts(fileContent);
    } else if (extension === 'txt') {
      return parseTxtPosts(fileContent);
    } else {
      throw new Error('Unsupported file format. Please use .txt or .csv');
    }
  } catch (error) {
    console.error('[parsePostFile] Error:', error.message);
    throw error;
  }
}

/**
 * Parse CSV file with posts
 * Expected format:
 * date,platform,content
 * 2024-04-10,facebook,"Post content here..."
 */
function parseCSVPosts(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one post');
  }

  const headers = parseCSVLine(lines[0]);
  const posts = [];

  // Find column indexes
  const dateIdx = headers.findIndex(h => h.toLowerCase() === 'date');
  const platformIdx = headers.findIndex(h => h.toLowerCase() === 'platform');
  const contentIdx = headers.findIndex(h => h.toLowerCase() === 'content');

  if (contentIdx === -1) {
    throw new Error('CSV must have a "content" column');
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);

    if (fields.length <= contentIdx) {
      continue; // Skip incomplete rows
    }

    const post = {
      content: fields[contentIdx]?.trim() || '',
      date: dateIdx >= 0 ? fields[dateIdx] : null,
      platform: platformIdx >= 0 ? fields[platformIdx]?.toLowerCase() : 'unknown',
      source: 'manual_upload',
    };

    if (post.content.length > 10) {
      // Only add posts with meaningful content
      posts.push(post);
    }
  }

  if (posts.length === 0) {
    throw new Error('No valid posts found in CSV file');
  }

  return posts;
}

/**
 * Parse simple text file with posts separated by blank lines
 * Each post should be separated by 2+ blank lines
 */
function parseTxtPosts(txtContent) {
  // Split by multiple blank lines
  const postBlocks = txtContent
    .split(/\n\s*\n+/)
    .map(block => block.trim())
    .filter(block => block.length > 10);

  if (postBlocks.length === 0) {
    throw new Error('No posts found in text file');
  }

  return postBlocks.map((content, idx) => ({
    content,
    date: null,
    platform: 'unknown',
    source: 'manual_upload',
  }));
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map(field => field.trim());
}

/**
 * Validate posts array
 */
export function validatePosts(posts) {
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('No posts to analyze');
  }

  if (posts.length > 1000) {
    console.warn('Warning: More than 1000 posts provided. Using first 1000.');
    return posts.slice(0, 1000);
  }

  return posts;
}

/**
 * Sanitize posts for storage
 */
export function sanitizePosts(posts) {
  return posts.map(post => ({
    content: post.content?.substring(0, 5000) || '', // Limit post length
    date: post.date || null,
    platform: post.platform || 'unknown',
    source: post.source || 'unknown',
    engagementMetrics: {
      likes: post.likes || 0,
      comments: post.comments || 0,
      shares: post.shares || 0,
    },
  }));
}

/**
 * Get post statistics
 */
export function getPostStats(posts) {
  if (!posts || posts.length === 0) {
    return null;
  }

  const platforms = {};
  let totalLength = 0;
  const words = [];

  posts.forEach(post => {
    const platform = post.platform || 'unknown';
    platforms[platform] = (platforms[platform] || 0) + 1;

    if (post.content) {
      totalLength += post.content.length;
      words.push(...post.content.split(/\s+/));
    }
  });

  return {
    totalPosts: posts.length,
    platforms,
    averagePostLength: Math.round(totalLength / posts.length),
    totalWords: words.length,
    averageWordsPerPost: Math.round(words.length / posts.length),
  };
}
