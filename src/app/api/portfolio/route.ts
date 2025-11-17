import { NextRequest, NextResponse } from "next/server";

const ZAPPER_API_KEY = process.env.ZAPPER_API_KEY;
const ZAPPER_API_URL = "https://public.zapper.xyz/graphql";

// Moonbeam chain ID
const MOONBEAM_CHAIN_ID = 1284;

// GraphQL query following Zapper docs exactly
const PORTFOLIO_QUERY = `
  query PortfolioV2Query($addresses: [Address!]!, $chainIds: [Int!]) {
    portfolioV2(addresses: $addresses, chainIds: $chainIds) {
      tokenBalances {
        totalBalanceUSD
        byToken(first: 50) {
          edges {
            node {
              tokenAddress
              symbol
              name
              decimals
              verified
              price
              balance
              balanceUSD
              balanceRaw
              imgUrlV2
              network {
                name
              }
            }
          }
        }
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    if (!ZAPPER_API_KEY) {
      return NextResponse.json(
        { error: "Zapper API key not configured" },
        { status: 500 }
      );
    }

    // Fetch portfolio from Zapper API
    const response = await fetch(ZAPPER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zapper-api-key": ZAPPER_API_KEY,
      },
      body: JSON.stringify({
        query: PORTFOLIO_QUERY,
        variables: {
          addresses: [address],
          chainIds: [MOONBEAM_CHAIN_ID],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Zapper API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    // Extract token balances
    const tokenBalances = data.data?.portfolioV2?.tokenBalances;
    const totalBalanceUSD = tokenBalances?.totalBalanceUSD || 0;
    const tokens =
      tokenBalances?.byToken?.edges?.map((edge: any) => edge.node) || [];

    return NextResponse.json({
      success: true,
      totalBalanceUSD,
      tokens,
    });
  } catch (error) {
    console.error("Portfolio API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch portfolio",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
