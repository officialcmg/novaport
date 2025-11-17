"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { moonbeam } from "viem/chains";

const moonbeamWithCustomRpc = {
  ...moonbeam,
  rpcUrls: {
    ...moonbeam.rpcUrls,
    default: {
      http: ["https://rpc.api.moonbeam.network"],
    },
  },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: moonbeamWithCustomRpc,
        supportedChains: [moonbeamWithCustomRpc],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
