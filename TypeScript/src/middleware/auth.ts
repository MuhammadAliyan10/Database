import { Request, NextFunction, Response } from "express";
import jwt from "jsonwebtoken";

interface DecodedToken {
  userId: string;
  user: string;
  username: string;
}

const authenticationToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      res.status(403).json({ message: "Access denied. No token provided." });
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET || "", (err, decoded) => {
      if (err) {
        res.status(403).json({ message: "Invalid token." });
        return;
      }

      req.user = decoded as DecodedToken;
      next();
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default authenticationToken;
