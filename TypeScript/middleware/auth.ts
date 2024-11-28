import { Request, NextFunction, Response } from "express";
import jwt from "jsonwebtoken";

interface DecodedToken {
  userId: string;
  username: string;
}

const authenticationToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res
        .status(403)
        .json({ message: "Access denied. No token provided." });
    }
    jwt.verify(token, process.env.JWT_SECRET || "", (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token." });
      }
      req.user = decoded as DecodedToken;
      next();
    });
  } catch (error) {
    console.log(error);
  }
};

export default authenticationToken;
