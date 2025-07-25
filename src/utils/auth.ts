import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";

export const verifyToken = async (token: string) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET!);
      return decoded as JwtPayload;
    }
  } catch (error) {
    console.error("Token verification error:", error);
  }

  return null;
};
