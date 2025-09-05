export default function Loading() {
  return (
    <section className="py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-md sm:max-w-2xl">
        <div className="animate-pulse space-y-6">
          {/* Back Button Skeleton */}
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-4"></div>
          
          {/* Main Image Skeleton */}
          <div className="aspect-[9/16] sm:aspect-[3/4] w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          
          {/* Content Skeleton */}
          <div className="space-y-3">
            {/* Title */}
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            {/* Category */}
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mx-auto"></div>
            {/* Description */}
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="flex justify-center space-x-6 py-4">
            <div className="text-center">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-10 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
            </div>
            <div className="text-center">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-10 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto"></div>
            </div>
          </div>

          {/* Buttons Skeleton */}
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="flex space-x-3">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            </div>
          </div>

          {/* Tags Skeleton */}
          <div className="flex flex-wrap justify-center gap-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>
          </div>
        </div>
      </div>
    </section>
  )
}