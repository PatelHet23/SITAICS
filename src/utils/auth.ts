import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

interface DecodedUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export const verifyToken = async (): Promise<DecodedUser | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.TOKEN_SECRET!
      ) as DecodedUser;
      return decoded;
    }
    return null;
  } catch (error) {
    return null;
  }
};
