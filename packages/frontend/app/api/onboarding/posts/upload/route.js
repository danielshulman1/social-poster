/**
 * API Route: Upload social media posts
 * POST /api/onboarding/posts/upload
 *
 * Handle file upload or text paste for posts
 */

import { requireAuth } from '../../../../utils/auth';
import { getInterviewProgress, updateInterviewProgress } from '../../../../utils/persona-db';
import { parsePostFile, validatePosts, getPostStats } from '../../../../lib/post-parser';

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { uploadType, fileContent, fileName, textPaste } = body;

    if (!uploadType || !['file', 'text'].includes(uploadType)) {
      return Response.json(
        { error: 'uploadType must be "file" or "text"' },
        { status: 400 }
      );
    }

    let posts = [];

    // Parse content based on type
    if (uploadType === 'file') {
      if (!fileContent || !fileName) {
        return Response.json(
          { error: 'fileContent and fileName required' },
          { status: 400 }
        );
      }

      posts = await parsePostFile(fileContent, fileName);
    } else if (uploadType === 'text') {
      if (!textPaste) {
        return Response.json(
          { error: 'textPaste content required' },
          { status: 400 }
        );
      }

      // Parse pasted text as simple posts (one per line or paragraph)
      const lines = textPaste.split('\n').filter(line => line.trim().length > 10);
      posts = lines.map(content => ({
        content,
        date: null,
        platform: 'unknown',
        source: 'manual_paste',
      }));
    }

    // Validate posts
    validatePosts(posts);

    // Get stats
    const stats = getPostStats(posts);

    // Save to progress
    const progress = await getInterviewProgress(user.id);
    await updateInterviewProgress(user.id, {
      postsChoice: uploadType === 'file' ? 'manual' : 'manual',
      collectedPosts: posts,
      currentStep: 3,
    });

    return Response.json({
      success: true,
      postsCount: posts.length,
      stats,
      readyForAnalysis: true,
      message: `Successfully uploaded ${posts.length} posts. Ready to build your persona!`,
    });
  } catch (error) {
    console.error('[posts-upload] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
