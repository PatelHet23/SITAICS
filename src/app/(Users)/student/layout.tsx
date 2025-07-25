import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Dashboard",
  description: "Student Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
