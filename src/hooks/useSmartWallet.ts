import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { createPublicClient, http, Address, createWalletClient, custom } from "viem";
import { moonbeam } from "viem/chains";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint06Address } from "viem/account-abstraction";

const FACTORY_ADDRESS = "0x0B101803e331184b97b1333298437a1183074fb4" as Address;
const MOONBEAM_RPC = "https://rpc.api.moonbeam.network";
const PIMLICO_API_KEY = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
const PIMLICO_URL = `https://api.pimlico.io/v2/1284/rpc?apikey=${PIMLICO_API_KEY}`;

export function useSmartWallet() {
  const { user, ready } = usePrivy();
  const { wallets } = useWallets();
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [smartAccountClient, setSmartAccountClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function getSmartAccount() {
      if (!ready || !user || wallets.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get embedded wallet from Privy wallets
        const embeddedWallet = wallets.find(
          (wallet) => wallet.walletClientType === "privy"
        );

        if (!embeddedWallet) {
          console.log("No embedded wallet found, waiting...");
          setIsLoading(false);
          return;
        }

        // 1. Create public client for blockchain queries
        const publicClient = createPublicClient({
          transport: http(MOONBEAM_RPC),
          chain: moonbeam,
        });

        // 2. Create Pimlico paymaster client (for gas sponsorship)
        const pimlicoClient = createPimlicoClient({
          transport: http(PIMLICO_URL),
          entryPoint: {
            address: entryPoint06Address,
            version: "0.6",
          },
        });

        // 3. Get Ethereum provider from embedded wallet
        const provider = await embeddedWallet.getEthereumProvider();
        
        if (!provider) {
          console.log("No Ethereum provider available");
          setIsLoading(false);
          return;
        }

        // 4. Create wallet client (signer) from provider
        const walletClient = createWalletClient({
          account: embeddedWallet.address as Address,
          chain: moonbeam,
          transport: custom(provider),
        });

        // 5. Create the smart account
        const account = await toSimpleSmartAccount({
          client: publicClient,
          owner: walletClient,
          factoryAddress: FACTORY_ADDRESS,
          entryPoint: {
            address: entryPoint06Address,
            version: "0.6",
          },
        });

        // 6. Create smart account client (this is what you use to send txs)
        const client = createSmartAccountClient({
          account,
          chain: moonbeam,
          bundlerTransport: http(PIMLICO_URL), // Pimlico bundler
          paymaster: pimlicoClient, // Pimlico paymaster for gas sponsorship
          userOperation: {
            estimateFeesPerGas: async () => {
              return (await pimlicoClient.getUserOperationGasPrice()).fast;
            },
          },
        });

        setSmartAccountAddress(account.address);
        setSmartAccountClient(client);
        console.log("✅ Smart account created:", account.address);
        console.log("✅ Gas sponsorship enabled via Pimlico");
      } catch (err) {
        console.error("Error creating smart account:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    getSmartAccount();
  }, [user, ready, wallets.length]); // Use wallets.length instead of wallets array

  return { smartAccountAddress, smartAccountClient, isLoading, error };
}
