"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { SwapWithQuote } from "@/types/swap";

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  swaps: SwapWithQuote[];
  isLoading: boolean;
  isExecuting: boolean;
  onConfirm: () => void;
}

export default function RebalanceModal({
  isOpen,
  onClose,
  swaps,
  isLoading,
  isExecuting,
  onConfirm,
}: RebalanceModalProps) {
  const totalValueUSD = swaps.reduce((sum, s) => sum + s.fromAmountUSD, 0);
  const totalCalls = swaps.reduce(
    (sum, s) => sum + (s.needsApproval ? 2 : 1),
    0
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Confirm Rebalancing
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                    disabled={isExecuting}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="py-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Fetching quotes from LI.FI...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Total Swaps</span>
                          <span className="font-semibold text-gray-900">
                            {swaps.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Total Transactions</span>
                          <span className="font-semibold text-gray-900">
                            {totalCalls}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Value</span>
                          <span className="font-semibold text-gray-900">
                            ${totalValueUSD.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {swaps.map((swap, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-500">
                                  #{index + 1}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {swap.fromSymbol}
                                </span>
                                <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {swap.toSymbol}
                                </span>
                              </div>
                              {swap.needsApproval && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  Needs Approval
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>
                                Amount: {swap.fromAmount.toFixed(4)} {swap.fromSymbol}
                              </div>
                              <div>Value: ${swap.fromAmountUSD.toFixed(2)}</div>
                              {swap.quote && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Expected: ~
                                  {(
                                    Number(swap.quote.estimate.toAmount) /
                                    10 ** swap.quote.action.toToken.decimals
                                  ).toFixed(4)}{" "}
                                  {swap.toSymbol}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-xs text-yellow-800">
                        <strong>Note:</strong> All transactions will be executed atomically
                        in a single batch. Gas fees will be sponsored by Pimlico paymaster.
                      </p>
                    </div>

                    {swaps.some(s => s.needsApproval) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-xs text-blue-800">
                          <strong>Approvals Required:</strong> Some swaps require token approvals.
                          These will be included automatically in the batch.
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        className="flex-1 inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        onClick={onClose}
                        disabled={isExecuting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="flex-1 inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onConfirm}
                        disabled={isExecuting}
                      >
                        {isExecuting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Executing...
                          </>
                        ) : (
                          "Confirm Rebalance"
                        )}
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
