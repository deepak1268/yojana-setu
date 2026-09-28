"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import type { SchemeRecommendation } from "@/lib/types";

interface BookmarkContextType {
  bookmarks: SchemeRecommendation[];
  bookmarkCount: number;
  loading: boolean;
  isBookmarked: (schemeId: string) => boolean;
  toggleBookmark: (scheme: SchemeRecommendation) => Promise<boolean>;
  removeBookmark: (schemeId: string) => Promise<void>;
  refreshBookmarks: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType | null>(null);

const STORAGE_KEY = "ys_bookmarked_schemes";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/+$/, "");

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<SchemeRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to persist to localStorage and broadcast change
  const saveToLocal = (items: SchemeRecommendation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event("ys_bookmarks_updated"));
    } catch (e) {
      console.error("Failed to save bookmarks to localStorage:", e);
    }
  };

  // Fetch from backend if authenticated, falling back to localStorage
  const refreshBookmarks = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Load from local storage first for instant display
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setBookmarks(JSON.parse(stored));
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.bookmarks) {
        setBookmarks(res.data.bookmarks);
        saveToLocal(res.data.bookmarks);
      }
    } catch (error) {
      console.warn("Could not sync bookmarks from backend:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync on mount and when user auth changes
  useEffect(() => {
    refreshBookmarks();

    // Listen to updates from other tabs/components
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setBookmarks(JSON.parse(stored));
        }
      } catch {
        // Ignore
      }
    };

    window.addEventListener("ys_bookmarks_updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("ys_bookmarks_updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user, refreshBookmarks]);

  const isBookmarked = useCallback(
    (schemeId: string) => {
      return bookmarks.some((b) => b.scheme_id === schemeId);
    },
    [bookmarks]
  );

  const toggleBookmark = async (scheme: SchemeRecommendation): Promise<boolean> => {
    const currentlyBookmarked = isBookmarked(scheme.scheme_id);
    let updated: SchemeRecommendation[];

    if (currentlyBookmarked) {
      updated = bookmarks.filter((b) => b.scheme_id !== scheme.scheme_id);
    } else {
      updated = [scheme, ...bookmarks.filter((b) => b.scheme_id !== scheme.scheme_id)];
    }

    // Optimistic UI update
    setBookmarks(updated);
    saveToLocal(updated);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (currentlyBookmarked) {
      toast.success(`Removed "${scheme.scheme_name}" from bookmarks`);
      if (token) {
        try {
          await axios.delete(`${API_URL}/api/bookmarks/${scheme.scheme_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.error("Backend delete bookmark error:", err);
        }
      }
      return false;
    } else {
      toast.success(`Saved "${scheme.scheme_name}" to bookmarks`);
      if (token) {
        try {
          await axios.post(
            `${API_URL}/api/bookmarks`,
            { scheme },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (err) {
          console.error("Backend add bookmark error:", err);
        }
      }
      return true;
    }
  };

  const removeBookmark = async (schemeId: string) => {
    const target = bookmarks.find((b) => b.scheme_id === schemeId);
    const updated = bookmarks.filter((b) => b.scheme_id !== schemeId);

    setBookmarks(updated);
    saveToLocal(updated);

    if (target) {
      toast.success(`Removed "${target.scheme_name}" from bookmarks`);
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      try {
        await axios.delete(`${API_URL}/api/bookmarks/${schemeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Backend delete bookmark error:", err);
      }
    }
  };

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        bookmarkCount: bookmarks.length,
        loading,
        isBookmarked,
        toggleBookmark,
        removeBookmark,
        refreshBookmarks,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within BookmarkProvider");
  }
  return context;
}
