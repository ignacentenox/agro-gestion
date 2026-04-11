"use client";
import WelcomeToast from "@/components/WelcomeToast";

export default function AppClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WelcomeToast />
      {children}
    </>
  );
}
