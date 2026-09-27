import { Request, Response } from "express";
import Bookmark from "../models/Bookmark";

interface AuthRequest extends Request {
    userId?: string;
}

export const getBookmarks = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const rawBookmarks = await Bookmark.find({ userId }).sort({ createdAt: -1 });

        // Transform into client-compatible SchemeRecommendation format
        const bookmarks = rawBookmarks.map((b) => ({
            scheme_id: b.schemeId,
            scheme_name: b.schemeName,
            match_score: b.matchScore ?? 0,
            eligibility_status: b.eligibilityStatus ?? "verification_required",
            financial_details: {
                max_loan: b.financialDetails?.maxLoan,
                percentage_financed: b.financialDetails?.percentageFinanced,
                interest_rate: b.financialDetails?.interestRate,
                max_tenure: b.financialDetails?.maxTenure,
                moratorium: b.financialDetails?.moratorium,
            },
            documents: b.documents || [],
            warnings: b.warnings || [],
            source: b.source || { name: "", url: "" },
            rank: 1,
            matched_rules: [],
            saved_at: b.createdAt,
        }));

        return res.status(200).json({ bookmarks });
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        return res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
};

export const addBookmark = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { scheme } = req.body;
        if (!scheme || !scheme.scheme_id || !scheme.scheme_name) {
            return res.status(400).json({ message: "Valid scheme details are required" });
        }

        const bookmark = await Bookmark.findOneAndUpdate(
            { userId, schemeId: scheme.scheme_id },
            {
                userId,
                schemeId: scheme.scheme_id,
                schemeName: scheme.scheme_name,
                matchScore: scheme.match_score ?? 0,
                eligibilityStatus: scheme.eligibility_status ?? "verification_required",
                financialDetails: {
                    maxLoan: scheme.financial_details?.max_loan,
                    percentageFinanced: scheme.financial_details?.percentage_financed,
                    interestRate: scheme.financial_details?.interest_rate,
                    maxTenure: scheme.financial_details?.max_tenure,
                    moratorium: scheme.financial_details?.moratorium,
                },
                documents: scheme.documents || [],
                warnings: scheme.warnings || [],
                source: scheme.source || {},
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(201).json({
            message: "Scheme bookmarked successfully",
            bookmark,
        });
    } catch (error) {
        console.error("Error adding bookmark:", error);
        return res.status(500).json({ message: "Failed to save bookmark" });
    }
};

export const deleteBookmark = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        const { schemeId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!schemeId) {
            return res.status(400).json({ message: "Scheme ID is required" });
        }

        const result = await Bookmark.findOneAndDelete({ userId, schemeId });

        if (!result) {
            return res.status(404).json({ message: "Bookmark not found" });
        }

        return res.status(200).json({ message: "Bookmark removed successfully" });
    } catch (error) {
        console.error("Error removing bookmark:", error);
        return res.status(500).json({ message: "Failed to remove bookmark" });
    }
};
