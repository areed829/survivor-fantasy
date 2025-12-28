import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import { TRPCReactProvider } from "@/trpc/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Survivor Fantasy",
  description: "Fantasy Survivor game inspired by the TV show Survivor",
};

// Check if Clerk keys are valid
const hasValidClerkKeys = () => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  return (
    publishableKey &&
    secretKey &&
    !publishableKey.includes("placeholder") &&
    !secretKey.includes("placeholder") &&
    publishableKey.startsWith("pk_") &&
    secretKey.startsWith("sk_")
  );
};

// Dynamically import ClerkProvider only if keys are valid
const ClerkProviderWrapper = hasValidClerkKeys()
  ? dynamic(() => import("@clerk/nextjs").then((mod) => mod.ClerkProvider), {
      ssr: true,
    })
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <body className={inter.className}>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );

  return (
    <ClerkProviderWrapper>
      {content}
      {!hasValidClerkKeys() && process.env.NODE_ENV === "development" && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#ff6b6b",
          color: "white",
          padding: "8px",
          textAlign: "center",
          fontSize: "12px",
          zIndex: 9999
        }}>
          ⚠️ Clerk authentication is disabled. Add valid Clerk keys to .env to enable authentication.
        </div>
      )}
    </ClerkProviderWrapper>
  );
}

