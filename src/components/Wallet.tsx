import React, { FC, useMemo } from "react";
import {WalletModalProvider} from '@solana/wallet-adapter-react-ui'
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "wallet-adapter-react-xnft";
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'
import {
  PhantomWalletAdapter
} from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

type Props = {
    children: JSX.Element | JSX.Element[] | null;
  };
  
  export function Wallet({ children }: Props) {
  // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint
  const endpoint = "https://rpc.helius.xyz/?api-key=6b1ccd35-ba2d-472a-8f54-9ac2c3c40b8b"

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new BackpackWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
        {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};