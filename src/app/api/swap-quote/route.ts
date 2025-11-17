import { NextRequest, NextResponse } from "next/server";

const LIFI_API_KEY = process.env.LIFI_API_KEY;
const LIFI_API_URL = "https://li.quest/v1/quote";
const MOONBEAM_CHAIN_ID = 1284;

export interface SwapQuoteRequest {
  fromToken: string;
  toToken: string;
  fromAmount: string; // In wei
  fromAddress: string;
  slippage?: number; // Optional, defaults to 0.5% (0.005)
}

export interface SwapQuoteResponse {
  transactionRequest: {
    to: string;
    data: string;
    value: string;
    from: string;
    chainId: number;
    gasLimit: string;
  };
  estimate: {
    approvalAddress: string;
    toAmount: string;
    toAmountMin: string;
    fromAmount: string;
  };
  action: {
    fromToken: {
      address: string;
      symbol: string;
      decimals: number;
    };
    toToken: {
      address: string;
      symbol: string;
      decimals: number;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SwapQuoteRequest = await request.json();
    const { fromToken, toToken, fromAmount, fromAddress, slippage = 0.005 } = body;

    if (!fromToken || !toToken || !fromAmount || !fromAddress) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log("🔍 Fetching LI.FI quote:", {
      fromToken,
      toToken,
      fromAmount,
      fromAddress,
      slippage
    });

    // Build LI.FI API URL
    const params = new URLSearchParams({
      fromChain: MOONBEAM_CHAIN_ID.toString(),
      toChain: MOONBEAM_CHAIN_ID.toString(),
      fromToken,
      toToken,
      fromAmount,
      fromAddress,
      slippage: slippage.toString(),
    });

    const url = `${LIFI_API_URL}?${params.toString()}`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Add API key if available
    if (LIFI_API_KEY) {
      headers["x-lifi-api-key"] = LIFI_API_KEY;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ LI.FI API error:", response.status, errorText);
      throw new Error(`LI.FI API error: ${response.status}`);
    }

    const data = await response.json();

    console.log("✅ LI.FI quote received:", {
      from: data.action?.fromToken?.symbol,
      to: data.action?.toToken?.symbol,
      fromAmount: data.estimate?.fromAmount,
      toAmount: data.estimate?.toAmount,
      approvalAddress: data.estimate?.approvalAddress
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("💥 Swap quote error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch swap quote",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
