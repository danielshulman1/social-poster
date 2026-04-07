# Platform Posting Examples

## How to Post to Each Social Media Platform

After connecting accounts, use these code examples to post content from your workflows.

---

## 🐦 X (Twitter) / Posts API v2

### Post a Simple Tweet

```typescript
import { prisma } from "@/lib/prisma";

export async function postToTwitter(
    connectionId: string,
    text: string
) {
    // Get connection
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    if (!connection) throw new Error("Connection not found");

    const creds = JSON.parse(connection.credentials);

    // Post tweet
    const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${creds.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
        }),
    });

    if (!response.ok) {
        throw new Error(`Twitter API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
        success: true,
        tweetId: result.data.id,
        url: `https://twitter.com/${creds.username}/status/${result.data.id}`,
    };
}
```

### Post Tweet with Media

```typescript
export async function postTweetWithMedia(
    connectionId: string,
    text: string,
    mediaIds: string[] // Array of media IDs
) {
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    const creds = JSON.parse(connection.credentials);

    const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${creds.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
            media: {
                media_ids: mediaIds,
            },
        }),
    });

    return response.json();
}
```

### Upload Media to Twitter

```typescript
export async function uploadMediaToTwitter(
    connectionId: string,
    imageBuffer: Buffer
) {
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    const creds = JSON.parse(connection.credentials);

    // Convert buffer to base64
    const base64 = imageBuffer.toString('base64');

    // Upload media
    const formData = new FormData();
    formData.append('media_data', base64);

    const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${creds.accessToken}`,
        },
        body: formData,
    });

    const result = await response.json();
    return result.media_id_string;
}
```

---

## 🎵 TikTok

### Initialize Video Upload

```typescript
export async function initTikTokVideoUpload(
    connectionId: string,
    videoSize: number,
    title: string
) {
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    const creds = JSON.parse(connection.credentials);

    const response = await fetch(
        'https://open.tiktokapis.com/v1/post/publish/video/init/',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${creds.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_info: {
                    source: 'FILE_UPLOAD',
                    video_size: videoSize,
                },
                post_info: {
                    title: title,
                    privacy_level: 'PUBLIC_TO_EVERYONE',
                },
            }),
        }
    );

    const result = await response.json();
    return {
        uploadId: result.data.upload_id,
        uploadToken: result.data.upload_token,
    };
}
```

### Upload Video File to TikTok

```typescript
export async function uploadTikTokVideo(
    uploadToken: string,
    videoBuffer: Buffer,
    chunkSize: number = 5 * 1024 * 1024 // 5MB chunks
) {
    const chunks = [];
    for (let i = 0; i < videoBuffer.length; i += chunkSize) {
        chunks.push(videoBuffer.slice(i, i + chunkSize));
    }

    for (let i = 0; i < chunks.length; i++) {
        const response = await fetch(
            'https://open.tiktokapis.com/v1/post/publish/video/upload/',
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'video/mp4',
                    'Content-Range': `bytes ${i * chunkSize}-${(i + 1) * chunkSize - 1}/*`,
                },
                body: chunks[i],
            }
        );

        if (!response.ok) {
            throw new Error(`TikTok upload chunk ${i} failed`);
        }
    }
}
```

### Complete TikTok Upload

```typescript
export async function completeTikTokVideoUpload(
    connectionId: string,
    uploadToken: string
) {
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    const creds = JSON.parse(connection.credentials);

    const response = await fetch(
        'https://open.tiktokapis.com/v1/post/publish/video/submit/',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${creds.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                upload_token: uploadToken,
            }),
        }
    );

    const result = await response.json();
    return {
        success: true,
        videoId: result.data.video_id,
    };
}
```

---

## ▶️ YouTube

### Upload Video

```typescript
export async function uploadYouTubeVideo(
    connectionId: string,
    videoFile: Buffer,
    title: string,
    description: string
) {
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    const creds = JSON.parse(connection.credentials);

    // Create metadata
    const metadata = {
        snippet: {
            title: title,
            description: description,
            tags: ['automated', 'workflow'],
            categoryId: '22', // People & Blogs
        },
        status: {
            privacyStatus: 'PUBLIC',
        },
    };

    // Create form data with video and metadata
    const formData = new FormData();
    formData.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    formData.append('file', new Blob([videoFile]), 'video.mp4');

    const response = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${creds.accessToken}`,
            },
            body: formData,
        }
    );

    const result = await response.json();
    return {
        success: true,
        videoId: result.id,
        url: `https://youtu.be/${result.id}`,
    };
}
```

### Schedule YouTube Video

```typescript
export async function scheduleYouTubeVideo(
    connectionId: string,
    videoId: string,
    scheduleTime: Date
) {
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    const creds = JSON.parse(connection.credentials);

    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=status`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${creds.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: videoId,
                status: {
                    privacyStatus: 'SCHEDULED',
                    publishAt: scheduleTime.toISOString(),
                },
            }),
        }
    );

    const result = await response.json();
    return {
        success: true,
        scheduledAt: result.status.publishAt,
    };
}
```

---

## 📌 Pinterest

### Create a Pin

```typescript
export async function createPinterestPin(
    connectionId: string,
    boardId: string,
    title: string,
    description: string,
    imageUrl: string,
    link?: string
) {
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    const creds = JSON.parse(connection.credentials);

    const response = await fetch('https://api.pinterest.com/v5/pins', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${creds.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            board_id: boardId,
            title: title,
            description: description,
            link: link || 'https://example.com',
            media_source: {
                source_type: 'image_url',
                url: imageUrl,
            },
        }),
    });

    const result = await response.json();
    return {
        success: true,
        pinId: result.id,
        url: `https://pinterest.com/pin/${result.id}/`,
    };
}
```

### Create Pin from Upload

```typescript
export async function createPinterestPinFromFile(
    connectionId: string,
    boardId: string,
    title: string,
    description: string,
    imageBuffer: Buffer,
    link?: string
) {
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    const creds = JSON.parse(connection.credentials);

    // First, upload image to Pinterest (gets a temporary URL)
    const uploadRes = await fetch(
        'https://api.pinterest.com/v5/media/upload',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${creds.accessToken}`,
            },
            body: new FormData().append('image', new Blob([imageBuffer])),
        }
    );

    const uploadData = await uploadRes.json();

    // Now create the pin
    const pinRes = await fetch('https://api.pinterest.com/v5/pins', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${creds.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            board_id: boardId,
            title: title,
            description: description,
            link: link || 'https://example.com',
            media_source: {
                source_type: 'image_url',
                url: uploadData.url,
            },
        }),
    });

    const result = await pinRes.json();
    return {
        success: true,
        pinId: result.id,
        url: `https://pinterest.com/pin/${result.id}/`,
    };
}
```

### Get User Boards

```typescript
export async function getPinterestBoards(connectionId: string) {
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    const creds = JSON.parse(connection.credentials);

    const response = await fetch(
        'https://api.pinterest.com/v5/user_account/boards?fields=id,name,description',
        {
            headers: {
                'Authorization': `Bearer ${creds.accessToken}`,
            },
        }
    );

    const result = await response.json();
    return result.data; // Array of { id, name, description }
}
```

---

## 📝 Threads (via Instagram API)

### Post to Threads

```typescript
export async function postToThreads(
    connectionId: string,
    text: string,
    imageUrl?: string
) {
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    const creds = JSON.parse(connection.credentials);

    // Get Instagram Business Account ID
    const igAccountId = creds.username; // Stored during Facebook OAuth

    const body: any = {
        media_type: imageUrl ? 'IMAGE' : 'TEXT',
        text: text,
    };

    if (imageUrl) {
        body.image_url = imageUrl;
    }

    const response = await fetch(
        `https://graph.instagram.com/v18.0/${igAccountId}/threads`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${creds.accessToken}`,
            },
            body: new URLSearchParams(body),
        }
    );

    const result = await response.json();
    return {
        success: true,
        threadId: result.id,
    };
}
```

---

## 🎯 Bluesky (No OAuth - Manual Entry)

### Post to Bluesky

```typescript
export async function postToBluesky(
    connectionId: string,
    text: string
) {
    const connection = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
    });

    const creds = JSON.parse(connection.credentials);

    // Step 1: Authenticate
    const authRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            identifier: creds.handle,
            password: creds.appPassword,
        }),
    });

    const authData = await authRes.json();
    const accessToken = authData.accessToken;
    const did = authData.did;

    // Step 2: Create post
    const postRes = await fetch(
        'https://bsky.social/xrpc/com.atproto.repo.createRecord',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                repo: did,
                collection: 'app.bsky.feed.post',
                record: {
                    '$type': 'app.bsky.feed.post',
                    text: text,
                    createdAt: new Date().toISOString(),
                },
            }),
        }
    );

    const result = await postRes.json();
    return {
        success: true,
        uri: result.uri,
        cid: result.cid,
    };
}
```

---

## 🔄 Workflow Integration Example

```typescript
// In your workflow execution logic:

async function executePublishNode(node: WorkflowNode, context: ExecutionContext) {
    const { platform, connectionId, content } = node.config;

    const result = {
        platform,
        success: false,
        url: null,
        error: null,
    };

    try {
        switch (platform) {
            case 'twitter':
                const tweetResult = await postToTwitter(connectionId, content);
                result.success = tweetResult.success;
                result.url = tweetResult.url;
                break;

            case 'tiktok':
                // Handle TikTok video upload
                break;

            case 'youtube':
                // Handle YouTube upload
                break;

            case 'pinterest':
                // Handle Pinterest pin creation
                break;

            case 'bluesky':
                const bskyResult = await postToBluesky(connectionId, content);
                result.success = bskyResult.success;
                break;
        }
    } catch (error) {
        result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
}
```

---

## 🚨 Error Handling

```typescript
export async function postWithErrorHandling(
    platform: string,
    connectionId: string,
    content: any
) {
    try {
        switch (platform) {
            case 'twitter':
                return await postToTwitter(connectionId, content.text);
            // ... other platforms
        }
    } catch (error) {
        if (error instanceof Error) {
            // Token expired - try refresh
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                // Trigger token refresh
                console.error('Token expired, need refresh');
            }
            
            // Rate limited
            if (error.message.includes('429')) {
                throw new Error('Rate limited. Please try again later.');
            }
        }
        
        throw error;
    }
}
```

---

## ✅ Best Practices

1. **Always validate credentials** before posting
2. **Check token expiration** and refresh if needed
3. **Implement retry logic** for transient failures
4. **Log all API calls** for debugging
5. **Rate limit** your posting to avoid platform restrictions
6. **Sanitize user input** before sending to platforms
7. **Test on staging** before production launch

---

Great! Now your workflows can post to multiple platforms! 🚀
