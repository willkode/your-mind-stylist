import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find all blog posts with status 'scheduled' and publish_date in the past
    const scheduledPosts = await base44.asServiceRole.entities.BlogPost.filter({ status: 'scheduled' });

    const now = new Date();
    let published = 0;

    for (const post of scheduledPosts) {
      if (post.publish_date && new Date(post.publish_date) <= now) {
        await base44.asServiceRole.entities.BlogPost.update(post.id, { status: 'published' });
        published++;
        console.log(`Published scheduled blog post: "${post.title}" (ID: ${post.id})`);
      }
    }

    return Response.json({
      success: true,
      checked: scheduledPosts.length,
      published,
      message: `Checked ${scheduledPosts.length} scheduled posts, published ${published}`
    });
  } catch (error) {
    console.error('Blog publish error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});