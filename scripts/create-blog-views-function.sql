-- Create function to increment blog post views
CREATE OR REPLACE FUNCTION increment_blog_views(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE blog_posts
    SET views = views + 1,
        updated_at = NOW()
    WHERE id = post_id;
    
    -- If no row was updated, that means the post doesn't exist
    -- We can choose to ignore this silently or raise an exception
    -- For now, we'll ignore it silently for better UX
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION increment_blog_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_blog_views(UUID) TO authenticated;