
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from "@/firebase/provider";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { cn } from "@/lib/utils";
import { playfair, ptSans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfoMed Central",
  description: "Directorio médico y agendamiento de citas.",
};

// RootLayout is now a clean, server-side component.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          playfair.variable,
          ptSans.variable
        )}
      >
        {/* FirebaseProvider now handles its own initialization on the client */}
        <FirebaseProvider>
          <div className="relative flex min-h-dvh flex-col bg-background">
            <FirebaseErrorListener />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
