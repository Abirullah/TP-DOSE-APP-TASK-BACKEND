import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing token" });
  const parts = auth.split(" ");
  if (parts.length !== 2)
    return res.status(401).json({ message: "Invalid token" });
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
