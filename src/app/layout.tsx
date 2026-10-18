import "./globals.css";

export const metadata = {
  title: "Adaptive DSA",
  description: "LeetCode tracking, adaptive assessments, AI feedback and personalized DSA roadmaps"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}