"use client";

import { useState, useEffect, useMemo } from "react";

interface Token {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToken: (token: Token) => void;
  existingTokens: string[]; // Addresses already in portfolio
}

export default function AddTokenModal({
  isOpen,
  onClose,
  onAddToken,
  existingTokens,
}: AddTokenModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load tokenlist on mount
  useEffect(() => {
    if (isOpen && tokenList.length === 0) {
      setIsLoading(true);
      fetch("/tokenlist.json")
        .then((res) => res.json())
        .then((data) => {
          // Sort alphabetically by symbol
          const sortedTokens = (data.tokens || []).sort((a: Token, b: Token) => 
            a.symbol.localeCompare(b.symbol)
          );
          setTokenList(sortedTokens);
          setIsLoading(false);
          console.log("✅ Loaded", sortedTokens.length, "tokens");
        })
        .catch((err) => {
          console.error("Failed to load tokenlist:", err);
          setIsLoading(false);
        });
    }
  }, [isOpen, tokenList.length]);

  // Filter tokens by search query and exclude existing (already sorted alphabetically)
  const filteredTokens = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = tokenList.filter((token) => {
      // Exclude tokens already in portfolio
      if (existingTokens.includes(token.address.toLowerCase())) return false;
      
      // If no query, show all
      if (!query) return true;
      
      // Filter by query
      return (
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
      );
    });
    
    console.log("🔍 Filtered", filtered.length, "tokens for query:", query || "(all)");
    return filtered;
  }, [searchQuery, tokenList, existingTokens]);

  if (!isOpen) return null;

  const handleAddToken = (token: Token) => {
    onAddToken(token);
    setSearchQuery("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Add Token</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, symbol, or address..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Token List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading tokens...</div>
          ) : filteredTokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? "No tokens found" : "All tokens already added"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleAddToken(token)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    {token.logoURI ? (
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 flex items-center space-x-2">
                        <span>{token.symbol}</span>
                        {token.tags?.includes("stablecoin") && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Stablecoin
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            Adding a token sets it to 0% allocation. Adjust sliders to rebalance.
          </p>
        </div>
      </div>
    </div>
  );
}
