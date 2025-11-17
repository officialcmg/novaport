"use client";

import { usePrivy } from "@privy-io/react-auth";
import SettingsDropdown from "./settings-dropdown";

export default function AppHeader() {
  const { authenticated } = usePrivy();

  if (!authenticated) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-white rounded-full border-t-transparent animate-spin-slow" />
            </div>
            <span className="text-2xl font-semibold">Novaport</span>
          </div>
          
          <SettingsDropdown />
        </div>
      </div>
    </header>
  );
}
