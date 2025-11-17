"use client";

import { useState } from "react";
import { Address, parseUnits, encodeFunctionData } from "viem";
import { ERC20_ABI } from "@/utils/erc20";

interface SendItem {
  id: string;
  recipient: Address | "";
  token: string;
  tokenSymbol: string;
  tokenDecimals: number;
  amount: string;
}

interface BatchSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (calls: { to: Address; value: bigint; data: `0x${string}` }[]) => Promise<void>;
  availableTokens: Array<{
    address: string;
    symbol: string;
    decimals: number;
    balance: number;
    balanceRaw: string;
    isNative: boolean;
  }>;
  isExecuting: boolean;
}

export default function BatchSendModal({
  isOpen,
  onClose,
  onExecute,
  availableTokens,
  isExecuting,
}: BatchSendModalProps) {
  const [sends, setSends] = useState<SendItem[]>([
    {
      id: crypto.randomUUID(),
      recipient: "",
      token: "",
      tokenSymbol: "",
      tokenDecimals: 18,
      amount: "",
    },
  ]);
  const [setAllRecipients, setSetAllRecipients] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const addSend = () => {
    setSends([
      ...sends,
      {
        id: crypto.randomUUID(),
        recipient: setAllRecipients && sends[0].recipient ? sends[0].recipient : "",
        token: "",
        tokenSymbol: "",
        tokenDecimals: 18,
        amount: "",
      },
    ]);
  };

  const removeSend = (id: string) => {
    if (sends.length === 1) return;
    setSends(sends.filter((s) => s.id !== id));
  };

  const updateSend = (id: string, field: keyof SendItem, value: any) => {
    setSends(
      sends.map((s) => {
        if (s.id === id) {
          // If changing recipient and setAllRecipients is on, update all
          if (field === "recipient" && setAllRecipients) {
            setSends(sends.map((send) => ({ ...send, recipient: value })));
            return { ...s, recipient: value };
          }
          
          // If changing token, update decimals and symbol
          if (field === "token") {
            const token = availableTokens.find((t) => t.address === value);
            if (token) {
              return {
                ...s,
                token: value,
                tokenSymbol: token.symbol,
                tokenDecimals: token.decimals,
              };
            }
          }
          
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  const toggleSetAllRecipients = () => {
    const newValue = !setAllRecipients;
    setSetAllRecipients(newValue);
    
    // If turning on, set all recipients to first recipient
    if (newValue && sends[0].recipient) {
      setSends(sends.map((s) => ({ ...s, recipient: sends[0].recipient })));
    }
  };

  const handleExecute = async () => {
    setError(null);

    // Validate
    console.log("🔍 Validating batch send:", { sends });
    for (const send of sends) {
      if (!send.recipient) {
        setError("All sends must have a recipient");
        return;
      }
      if (!send.token) {
        setError("All sends must have a token selected");
        return;
      }
      if (!send.amount || parseFloat(send.amount) <= 0) {
        setError("All sends must have a valid amount");
        return;
      }
    }

    try {
      // Build calls
      const calls = sends.map((send, index) => {
        const token = availableTokens.find((t) => t.address === send.token);
        if (!token) throw new Error(`Token not found: ${send.token}`);

        const amountWei = parseUnits(send.amount, send.tokenDecimals);
        
        console.log(`💸 Send #${index + 1}:`, {
          token: token.symbol,
          isNative: token.isNative,
          recipient: send.recipient,
          amount: send.amount,
          amountWei: amountWei.toString(),
          decimals: send.tokenDecimals,
        });

        if (token.isNative) {
          // Native token transfer (GLMR)
          console.log(`  → Native transfer: ${send.amount} ${token.symbol} to ${send.recipient}`);
          return {
            to: send.recipient as Address,
            value: amountWei,
            data: "0x" as `0x${string}`,
          };
        } else {
          // ERC20 transfer
          console.log(`  → ERC20 transfer: ${send.amount} ${token.symbol} to ${send.recipient}`);
          const transferData = encodeFunctionData({
            abi: [
              {
                name: "transfer",
                type: "function",
                stateMutability: "nonpayable",
                inputs: [
                  { name: "to", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
                outputs: [{ name: "", type: "bool" }],
              },
            ] as const,
            functionName: "transfer",
            args: [send.recipient as Address, amountWei],
          });
          
          console.log(`  → Transfer data:`, transferData);
          
          return {
            to: send.token as Address,
            value: BigInt(0),
            data: transferData,
          };
        }
      });

      console.log("🚀 Built batch send calls:", {
        totalCalls: calls.length,
        calls: calls.map((c, i) => ({
          index: i,
          to: c.to,
          value: c.value.toString(),
          data: c.data,
        })),
      });

      console.log("📤 Calling onExecute with calls...");
      await onExecute(calls);
      console.log("✅ Batch send completed successfully!");
      
      // Reset form on success
      setSends([
        {
          id: crypto.randomUUID(),
          recipient: "",
          token: "",
          tokenSymbol: "",
          tokenDecimals: 18,
          amount: "",
        },
      ]);
      onClose();
    } catch (err) {
      console.error("❌ Batch send failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to execute batch send";
      console.error("❌ Error details:", errorMessage);
      setError(errorMessage);
      // Don't close modal on error so user can see the error and retry
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Batch Send 🚀</h2>
            <button
              onClick={onClose}
              disabled={isExecuting}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Send multiple tokens to multiple recipients in one transaction
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Set all recipients toggle */}
          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={setAllRecipients}
              onChange={toggleSetAllRecipients}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Set all recipients to same address</span>
          </label>

          {/* Send items */}
          <div className="space-y-4">
            {sends.map((send, index) => (
              <div key={send.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Send #{index + 1}</span>
                  {sends.length > 1 && (
                    <button
                      onClick={() => removeSend(send.id)}
                      disabled={isExecuting}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Recipient */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={send.recipient}
                    onChange={(e) => updateSend(send.id, "recipient", e.target.value)}
                    placeholder="0x..."
                    disabled={isExecuting || (setAllRecipients && index !== 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Token */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Token</label>
                    <select
                      value={send.token}
                      onChange={(e) => updateSend(send.id, "token", e.target.value)}
                      disabled={isExecuting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                    >
                      <option value="">Select token</option>
                      {availableTokens.map((token) => (
                        <option key={token.address} value={token.address}>
                          {token.symbol} ({token.balance.toFixed(4)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={send.amount}
                        onChange={(e) => updateSend(send.id, "amount", e.target.value)}
                        placeholder="0.0"
                        step="any"
                        disabled={isExecuting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                      />
                      {/* Quick amount buttons */}
                      {send.token && (
                        <div className="flex gap-1">
                          {[
                            { label: "MAX", percent: 1 },
                            { label: "50%", percent: 0.5 },
                            { label: "25%", percent: 0.25 },
                          ].map(({ label, percent }) => {
                            const token = availableTokens.find((t) => t.address === send.token);
                            return (
                              <button
                                key={label}
                                onClick={() => {
                                  if (token) {
                                    // Use human-readable balance for display (will be converted to Wei later)
                                    const amount = token.balance * percent;
                                    updateSend(send.id, "amount", amount.toFixed(token.decimals));
                                  }
                                }}
                                disabled={isExecuting}
                                className="flex-1 px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-blue-100 hover:text-blue-600 rounded transition-colors disabled:opacity-50"
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add button */}
          <button
            onClick={addSend}
            disabled={isExecuting}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Another Send</span>
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              <strong>Total Sends:</strong> {sends.length}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Gas:</strong> Sponsored by Pimlico 🎉
            </div>
          </div>
          <button
            onClick={handleExecute}
            disabled={isExecuting || sends.some((s) => !s.recipient || !s.token || !s.amount)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isExecuting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Executing Batch...
              </span>
            ) : (
              "Execute Batch Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
