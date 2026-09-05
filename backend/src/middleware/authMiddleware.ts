import { Request,Response,NextFunction } from "express";
import jwt from "jsonwebtoken"

export const authMiddleware = (req:Request,res:Response,next:NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader) {
            return res.status(401).json({
                message: "Not Authorised"
            });
        }

        const token = authHeader.split(" ")[1] as string;
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY as string);

        // @ts-ignore
        req.userId = decoded.userId;
        next();

    } catch(err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        })
    }
} 