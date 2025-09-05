-- Blog Comments Schema
-- This script creates the necessary tables for blog comments functionality

-- 1. Blog Comments Table
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE, -- For replies
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  author_website VARCHAR(255), -- Optional website URL
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  user_ip INET, -- Store IP for moderation
  user_agent TEXT, -- Store user agent for moderation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT valid_content_length CHECK (LENGTH(content) >= 3 AND LENGTH(content) <= 5000),
  CONSTRAINT valid_author_name CHECK (LENGTH(author_name) >= 2 AND LENGTH(author_name) <= 100),
  CONSTRAINT valid_email CHECK (author_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON blog_comments(created_at DESC);

-- 2. Blog Comment Votes Table (for like/dislike functionality)
CREATE TABLE IF NOT EXISTS blog_comment_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
  user_ip INET NOT NULL,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate votes from same IP
  UNIQUE(comment_id, user_ip)
);

-- Index for comment vote queries
CREATE INDEX IF NOT EXISTS idx_blog_comment_votes_comment_id ON blog_comment_votes(comment_id);

-- 3. Update trigger for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to blog_comments
DROP TRIGGER IF EXISTS update_blog_comments_updated_at ON blog_comments;
CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS (Row Level Security) - Enable when ready for production
-- This ensures users can only see approved comments
-- ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to approved comments
-- CREATE POLICY "Public can view approved comments" ON blog_comments
--   FOR SELECT USING (status = 'approved');

-- Policy for admin access (when authentication is set up)
-- CREATE POLICY "Admin can manage all comments" ON blog_comments
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 5. Helper function to get comment count for a post
CREATE OR REPLACE FUNCTION get_post_comment_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM blog_comments
        WHERE post_id = post_uuid
        AND status = 'approved'
        AND parent_id IS NULL -- Only count top-level comments
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_post_comment_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_post_comment_count(UUID) TO authenticated;

-- 6. Helper function to get total comment count including replies
CREATE OR REPLACE FUNCTION get_post_total_comment_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM blog_comments
        WHERE post_id = post_uuid
        AND status = 'approved'
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_post_total_comment_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_post_total_comment_count(UUID) TO authenticated;

-- 7. Sample data for testing (uncomment to add test comments)
-- INSERT INTO blog_comments (post_id, author_name, author_email, content, status) VALUES
-- ((SELECT id FROM blog_posts LIMIT 1), 'John Doe', 'john@example.com', 'Great article! Really helpful tips for customizing wallpapers.', 'approved'),
-- ((SELECT id FROM blog_posts LIMIT 1), 'Jane Smith', 'jane@example.com', 'I love the minimalist approach. Any recommendations for good color schemes?', 'approved');