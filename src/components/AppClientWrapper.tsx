"use client";
import WelcomeSplash from "@/components/WelcomeSplash";

export default function AppClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WelcomeSplash />
      {children}
    </>
  );
}
