'use client'

import React, { useEffect, useState } from 'react'
import { CommentForm } from './comment-form'
import { CommentDisplay } from './comment-display'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BlogCommentWithReplies } from '@/lib/database.types'

interface CommentsSectionProps {
  postId: string
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const [comments, setComments] = useState<BlogCommentWithReplies[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchComments = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}/comments`)
      if (response.ok) {
        const commentsData = await response.json()
        setComments(commentsData)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [postId])

  const handleRefresh = () => {
    fetchComments(true)
  }

  const handleCommentSubmitted = () => {
    fetchComments(true)
  }

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
                  <span className="text-muted-foreground">Loading comments...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="space-y-8">
          {/* Section Header */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center justify-center gap-3">
              <MessageCircle className="w-8 h-8 text-brand-orange" />
              Comments & Discussion
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Share your thoughts, ask questions, and connect with other readers. 
              All comments are moderated to ensure a positive discussion environment.
            </p>
          </div>

          {/* Comments Display */}
          <Card>
            <CardContent className="p-8">
              <div className="space-y-8">
                {/* Refresh Button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Discussion</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>

                {/* Comments */}
                <CommentDisplay
                  comments={comments}
                  postId={postId}
                  onRefresh={handleRefresh}
                />

                {/* Comment Form */}
                <div className="border-t pt-8">
                  <CommentForm
                    postId={postId}
                    onCommentSubmitted={handleCommentSubmitted}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comment Guidelines */}
          <Card className="bg-brand-orange/5 border-brand-orange/20">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-3 text-brand-orange">Community Guidelines</h4>
              <div className="grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p>• Be respectful and constructive</p>
                  <p>• Stay on topic and relevant</p>
                  <p>• No spam or promotional content</p>
                </div>
                <div className="space-y-2">
                  <p>• Comments are moderated</p>
                  <p>• Email addresses are kept private</p>
                  <p>• Report inappropriate content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}