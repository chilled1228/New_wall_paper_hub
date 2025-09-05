'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Send, User, Mail, Globe } from 'lucide-react'
import { toast } from 'sonner'

interface CommentFormProps {
  postId: string
  parentId?: string
  onCommentSubmitted: () => void
  onCancel?: () => void
  placeholder?: string
}

export function CommentForm({ 
  postId, 
  parentId, 
  onCommentSubmitted, 
  onCancel,
  placeholder = "Share your thoughts..."
}: CommentFormProps) {
  const [formData, setFormData] = useState({
    author_name: '',
    author_email: '',
    author_website: '',
    content: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.author_name.trim() || !formData.author_email.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.content.length < 3) {
      toast.error('Comment must be at least 3 characters long')
      return
    }

    if (formData.content.length > 5000) {
      toast.error('Comment must be less than 5000 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/blog/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parent_id: parentId || null
        }),
      })

      if (response.ok) {
        toast.success('Comment submitted successfully! It will be reviewed before appearing.')
        setFormData({
          author_name: '',
          author_email: '',
          author_website: '',
          content: ''
        })
        onCommentSubmitted()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit comment')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Failed to submit comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isReply = !!parentId

  return (
    <div className={`${isReply ? 'ml-4 sm:ml-8 mt-6' : 'mt-12'} max-w-4xl`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <MessageCircle className="w-5 h-5 text-primary" />
          {isReply ? 'Reply to Comment' : 'Leave a Comment'}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name and Email Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="author_name" className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="w-4 h-4 text-muted-foreground" />
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="author_name"
              type="text"
              value={formData.author_name}
              onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
              placeholder="Your name"
              required
              maxLength={100}
              disabled={isSubmitting}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="author_email" className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="author_email"
              type="email"
              value={formData.author_email}
              onChange={(e) => setFormData(prev => ({ ...prev, author_email: e.target.value }))}
              placeholder="your@email.com"
              required
              maxLength={255}
              disabled={isSubmitting}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Your email will not be published
            </p>
          </div>
        </div>


        {/* Comment Field */}
        <div className="space-y-2">
          <Label htmlFor="content" className="text-sm font-medium text-foreground">
            Comment <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder={placeholder}
            required
            minLength={3}
            maxLength={5000}
            rows={isReply ? 4 : 6}
            disabled={isSubmitting}
            className="resize-none"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Markdown formatting supported</span>
            <span className={`font-mono ${formData.content.length > 4500 ? 'text-warning' : ''} ${formData.content.length >= 5000 ? 'text-destructive' : ''}`}>
              {formData.content.length}/5000
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : (isReply ? 'Post Reply' : 'Post Comment')}
          </Button>
          
          {isReply && onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Comment Policy */}
        <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-md border-l-4 border-primary/30">
          <p className="font-medium text-foreground mb-2">Comment Policy:</p>
          <ul className="space-y-1 text-xs list-disc list-inside">
            <li>Comments are moderated and may take time to appear</li>
            <li>Be respectful and constructive in your feedback</li>
            <li>No links, URLs, or website references allowed</li>
            <li>Spam and promotional content will be automatically rejected</li>
            <li>Your email address will never be shared or sold</li>
          </ul>
        </div>
      </form>
    </div>
  )
}