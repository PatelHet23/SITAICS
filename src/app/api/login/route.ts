import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { emailOrUsername, password, captchaToken } = reqBody;
    const isEmail = emailOrUsername.includes("@");
    if (!captchaToken) {
      return NextResponse.json(
        { error: "Missing CAPTCHA token" },
        { status: 400 }
      );
    }
    const secret = process.env.TURNSTILE_SECRET_KEY!;
    const verifyURL =
      "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    const { data } = await axios.post(
      verifyURL,
      new URLSearchParams({
        secret,
        response: captchaToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!data.success) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed" },
        { status: 400 }
      );
    }

    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: emailOrUsername } })
      : await prisma.user.findUnique({ where: { username: emailOrUsername } });

    if (!user) {
      return NextResponse.json(
        { error: "User does not exist" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is inactive. Please contact Admin." },
        { status: 403 }
      );
    }

    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 403 }
      );
    }

    const tokenData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenData, process.env.TOKEN_SECRET!, {
      expiresIn: "1d",
    });

    const response = NextResponse.json({
      message: "Logged In Successfully",
      success: true,
      role: user.role,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV! === "development",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
