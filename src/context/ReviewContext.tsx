import React, { createContext, useContext, useState, useEffect } from "react";

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  isUserSubmitted: boolean;
}

interface ReviewContextType {
  reviews: Review[];
  addReview: (review: { productId: string; userName: string; rating: number; comment: string }) => void;
  getReviewsByProduct: (productId: string) => Review[];
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const savedReviews = localStorage.getItem("toyes_reviews_v2");
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("toyes_reviews_v2", JSON.stringify(reviews));
  }, [reviews]);

  const addReview = ({ productId, userName, rating, comment }: { productId: string; userName: string; rating: number; comment: string }) => {
    const newReview: Review = {
      id: Math.random().toString(36).substring(7),
      productId,
      userName,
      rating,
      comment,
      date: new Date().toISOString(),
      isUserSubmitted: true,
    };
    setReviews((prev) => [newReview, ...prev]);
  };

  const getReviewsByProduct = (productId: string) => reviews.filter(r => r.productId === productId);

  return (
    <ReviewContext.Provider value={{ reviews, addReview, getReviewsByProduct }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) throw new Error("useReviews must be used within ReviewProvider");
  return context;
};
