'use client'

import Link from "next/link"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center flex-1 text-center">
        <div className="max-w-md mx-auto">
          {/* Error Icon */}
          <div className="mb-8">
            <div className="relative">
              <div className="w-24 h-24 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
          </div>
          
          {/* Error Message */}
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Something went wrong
          </h1>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            We encountered an unexpected error. This has been reported to our team 
            and we'll fix it as soon as possible.
          </p>
          
          {/* Error Details - Only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-muted rounded-lg text-left text-sm">
              <p className="font-mono text-destructive break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={reset} size="lg" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          {/* Help Text */}
          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              If this problem persists, please{' '}
              <Link 
                href="/contact" 
                className="text-primary hover:underline"
              >
                contact our support team
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}