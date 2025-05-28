"use client"

import { useState } from "react"
import { Star, ThumbsUp, ThumbsDown, Flag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Review {
  id: number
  user: {
    name: string
    avatar?: string
    verified: boolean
  }
  rating: number
  comment: string
  date: string
  helpful: number
  notHelpful: number
  images?: string[]
}

interface ReviewSystemProps {
  businessId?: number
  eventId?: number
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export function ReviewSystem({ businessId, eventId, reviews, averageRating, totalReviews }: ReviewSystemProps) {
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
  })
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const ratingDistribution = [
    { stars: 5, count: 124, percentage: 65 },
    { stars: 4, count: 32, percentage: 17 },
    { stars: 3, count: 18, percentage: 9 },
    { stars: 2, count: 12, percentage: 6 },
    { stars: 1, count: 6, percentage: 3 },
  ]

  const handleSubmitReview = () => {
    // Handle review submission
    console.log("Submitting review:", newReview)
    setIsDialogOpen(false)
    setNewReview({ rating: 0, comment: "" })
  }

  const renderStars = (rating: number, interactive = false, size = "w-4 h-4") => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
        onMouseEnter={interactive ? () => setHoveredRating(i + 1) : undefined}
        onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
        onClick={interactive ? () => setNewReview((prev) => ({ ...prev, rating: i + 1 })) : undefined}
      />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{averageRating}</div>
              <div className="flex justify-center mb-2">{renderStars(Math.floor(averageRating))}</div>
              <p className="text-sm text-muted-foreground">{totalReviews} reviews</p>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold mb-3">Rating Distribution</h3>
              <div className="space-y-2">
                {ratingDistribution.map((item) => (
                  <div key={item.stars} className="flex items-center gap-2">
                    <span className="text-sm w-6">{item.stars}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center md:text-right">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Write a Review</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>Share your experience with others</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Rating</Label>
                      <div className="flex gap-1 mt-1">
                        {renderStars(hoveredRating || newReview.rating, true, "w-6 h-6")}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="comment">Your Review</Label>
                      <Textarea
                        id="comment"
                        placeholder="Tell others about your experience..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview((prev) => ({ ...prev, comment: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSubmitReview} disabled={!newReview.rating || !newReview.comment}>
                        Submit Review
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Customer Reviews</h3>

        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{review.user.name}</span>
                    {review.user.verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">{renderStars(review.rating)}</div>

                  <p className="text-sm mb-3">{review.comment}</p>

                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image || "/placeholder.svg"}
                          alt={`Review image ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Helpful ({review.helpful})
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      Not helpful ({review.notHelpful})
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                      <Flag className="w-3 h-3 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button variant="outline">Load More Reviews</Button>
      </div>
    </div>
  )
}

export default ReviewSystem
