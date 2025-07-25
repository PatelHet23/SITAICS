import { cookies } from "next/headers";
import { verifyToken } from "@/utils/auth";
import type { Metadata } from "next";
import AccessDenied from "@/components/accessDenied";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin Dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const userRole = token ? await verifyToken(token) : null;

  if (!userRole?.role || userRole?.role !== "Admin") {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
