import mongoose, { Document, Schema } from "mongoose";

export interface IBookmark extends Document {
    userId: mongoose.Types.ObjectId;
    schemeId: string;
    schemeName: string;
    matchScore?: number;
    eligibilityStatus?: string;
    financialDetails?: {
        maxLoan?: string;
        percentageFinanced?: string;
        interestRate?: string;
        maxTenure?: string;
        moratorium?: string;
    };
    documents?: string[];
    warnings?: string[];
    source?: {
        name?: string;
        url?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        schemeId: {
            type: String,
            required: true,
            trim: true,
        },
        schemeName: {
            type: String,
            required: true,
            trim: true,
        },
        matchScore: {
            type: Number,
            default: 0,
        },
        eligibilityStatus: {
            type: String,
            default: "verification_required",
        },
        financialDetails: {
            maxLoan: { type: String },
            percentageFinanced: { type: String },
            interestRate: { type: String },
            maxTenure: { type: String },
            moratorium: { type: String },
        },
        documents: {
            type: [String],
            default: [],
        },
        warnings: {
            type: [String],
            default: [],
        },
        source: {
            name: { type: String },
            url: { type: String },
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate bookmark of the same scheme for a given user
bookmarkSchema.index({ userId: 1, schemeId: 1 }, { unique: true });

const Bookmark = mongoose.model<IBookmark>("Bookmark", bookmarkSchema);

export default Bookmark;
