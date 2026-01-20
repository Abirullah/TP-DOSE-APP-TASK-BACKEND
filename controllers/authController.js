import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import nodemailer from "nodemailer";

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpEmail = async (email, otp) => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Your verification code",
      text: `Your verification code is ${otp}`,
    });
  } else {
    console.log("[auth] OTP for", email, "=", otp);
  }
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashed, isVerified: true });
    await user.save();

    res.status(201).json({ message: "User created. Please sign in.", email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.json({ message: "Already verified" });
    if (!user.otp || !user.otpExpires)
      return res.status(400).json({ message: "No OTP set" });
    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpires < new Date())
      return res.status(400).json({ message: "OTP expired" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Email verified" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "5h" }
    );
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        active: user.active,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.userId || req.userId !== id)
      return res.status(403).json({ message: "Forbidden" });

    const updates = req.body;
    if (updates.password)
      updates.password = await bcrypt.hash(updates.password, 10);
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const startWorking = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByIdAndUpdate(
      userId,
      { active: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      message: "Started working",
      user: { id: user._id, active: user.active },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { signup, verifyEmail, signin, updateUser, startWorking };
