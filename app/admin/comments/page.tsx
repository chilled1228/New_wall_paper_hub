'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  User,
  Mail,
  Calendar,
  Eye,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  id: string
  post_id: string
  author_name: string
  author_email: string
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  user_ip: string
  created_at: string
  blog_posts: {
    title: string
    slug: string
  }
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchComments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comments?status=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      } else {
        toast.error('Failed to fetch comments')
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Error fetching comments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [filter])

  const updateCommentStatus = async (commentId: string, status: 'approved' | 'rejected' | 'spam') => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast.success(`Comment ${status}`)
        fetchComments()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${status} comment`)
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error(`Failed to ${status} comment`)
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this comment?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Comment deleted')
        fetchComments()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const filteredComments = comments.filter(comment =>
    comment.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.blog_posts.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'spam': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'spam': return <AlertTriangle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  const pendingCount = comments.filter(c => c.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comments Management</h1>
          <p className="text-muted-foreground">
            Review and moderate user comments
          </p>
        </div>
        {pendingCount > 0 && (
          <Alert className="max-w-sm">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {pendingCount} comment{pendingCount !== 1 ? 's' : ''} pending review
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Review ({comments.filter(c => c.status === 'pending').length})</SelectItem>
            <SelectItem value="approved">Approved ({comments.filter(c => c.status === 'approved').length})</SelectItem>
            <SelectItem value="rejected">Rejected ({comments.filter(c => c.status === 'rejected').length})</SelectItem>
            <SelectItem value="spam">Spam ({comments.filter(c => c.status === 'spam').length})</SelectItem>
            <SelectItem value="all">All Comments ({comments.length})</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading comments...</p>
            </CardContent>
          </Card>
        ) : filteredComments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No comments match your search.' : 'No comments found.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredComments.map((comment) => (
            <Card key={comment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{comment.author_name}</span>
                      <Badge variant="outline" className={getStatusColor(comment.status)}>
                        {getStatusIcon(comment.status)}
                        {comment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {comment.author_email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(comment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Blog Post Reference */}
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Comment on:</span>
                      <span className="font-medium">{comment.blog_posts.title}</span>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="bg-background border rounded-md p-4">
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {comment.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateCommentStatus(comment.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCommentStatus(comment.id, 'rejected')}
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCommentStatus(comment.id, 'spam')}
                          className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Mark as Spam
                        </Button>
                      </>
                    )}

                    {comment.status === 'approved' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCommentStatus(comment.id, 'rejected')}
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCommentStatus(comment.id, 'spam')}
                          className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Mark as Spam
                        </Button>
                      </>
                    )}

                    {(comment.status === 'rejected' || comment.status === 'spam') && (
                      <Button
                        size="sm"
                        onClick={() => updateCommentStatus(comment.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteComment(comment.id)}
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground ml-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}