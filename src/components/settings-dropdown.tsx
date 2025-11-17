"use client";

import { useState, useRef, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { 
  Cog6ToothIcon,
  WalletIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
  ClipboardIcon,
  CheckIcon
} from "@heroicons/react/24/outline";

export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = usePrivy();
  const { smartAccountAddress } = useSmartWallet();

  // Get email address exactly as per Privy docs
  const emailAccount = user?.linkedAccounts.find(
    (account) => account.type === "email"
  );
  const emailAddress = emailAccount?.address;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyAddress = async () => {
    if (smartAccountAddress) {
      await navigator.clipboard.writeText(smartAccountAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {/* Smart Account Address */}
          {smartAccountAddress && (
            <button
              onClick={copyAddress}
              className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3 border-b border-gray-100"
            >
              <WalletIcon className="w-6 h-6 text-gray-600 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="text-xs text-gray-500">Smart Account</div>
                <div className="text-gray-900 font-mono font-medium">
                  {truncateAddress(smartAccountAddress)}
                </div>
              </div>
              {copied ? (
                <CheckIcon className="w-5 h-5 text-green-500" />
              ) : (
                <ClipboardIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
          )}

          {/* Linked Email */}
          {emailAddress && (
            <div className="px-4 py-3 flex items-center space-x-3 border-b border-gray-100">
              <EnvelopeIcon className="w-6 h-6 text-gray-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-gray-900 font-medium">Linked email</div>
                <div className="text-gray-500 text-sm truncate">{emailAddress}</div>
              </div>
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-900 font-medium"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-600 flex-shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
