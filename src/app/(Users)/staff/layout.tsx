import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Dashboard",
  description: "Staff Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
