'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageCircle, Reply, ThumbsUp, ThumbsDown, Globe } from 'lucide-react'
import { CommentForm } from './comment-form'
import type { BlogCommentWithReplies } from '@/lib/database.types'

interface CommentDisplayProps {
  comments: BlogCommentWithReplies[]
  postId: string
  onRefresh: () => void
}

export function CommentDisplay({ comments, postId, onRefresh }: CommentDisplayProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
        <p className="text-muted-foreground">
          Be the first to share your thoughts!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h3>
      
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: BlogCommentWithReplies
  postId: string
  onRefresh: () => void
  depth?: number
}

function CommentItem({ comment, postId, onRefresh, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleReplySubmitted = () => {
    setShowReplyForm(false)
    onRefresh()
  }

  const maxDepth = 3 // Limit nesting depth to prevent excessive indentation

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : ''}`}>
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Comment Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-brand-orange/10 text-brand-orange text-sm">
                    {getInitials(comment.author_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {comment.author_website ? (
                        <a 
                          href={comment.author_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-brand-orange transition-colors flex items-center gap-1"
                        >
                          {comment.author_name}
                          <Globe className="w-3 h-3" />
                        </a>
                      ) : (
                        comment.author_name
                      )}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {formatDate(comment.created_at)}
                  </p>
                </div>
              </div>

              {/* Collapse button for comments with replies */}
              {comment.replies && comment.replies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-xs"
                >
                  {isCollapsed ? `Show ${comment.replies.length} replies` : 'Hide replies'}
                </Button>
              )}
            </div>

            {/* Comment Content */}
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>

            {/* Comment Actions */}
            <div className="flex items-center gap-4 pt-2">
              {depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs flex items-center gap-1 hover:text-brand-orange"
                >
                  <Reply className="w-3 h-3" />
                  Reply
                </Button>
              )}

              {/* Vote buttons (future enhancement) */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs flex items-center gap-1 hover:text-green-600"
                  disabled
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span className="sr-only">Like</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs flex items-center gap-1 hover:text-red-600"
                  disabled
                >
                  <ThumbsDown className="w-3 h-3" />
                  <span className="sr-only">Dislike</span>
                </Button>
              </div>

              <span className="text-xs text-muted-foreground ml-auto">
                #{comment.id.slice(-8)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      {showReplyForm && (
        <CommentForm
          postId={postId}
          parentId={comment.id}
          onCommentSubmitted={handleReplySubmitted}
          onCancel={() => setShowReplyForm(false)}
          placeholder={`Reply to ${comment.author_name}...`}
        />
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && !isCollapsed && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onRefresh={onRefresh}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}