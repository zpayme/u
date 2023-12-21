"use client";

import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";

import { bsc, polygon } from "viem/chains";

import { WagmiConfig } from "wagmi";
import { WALLET_CONNECT_PROJECT_ID } from "../config";

const projectId = WALLET_CONNECT_PROJECT_ID || "429fcf002dc689ab04c1e70b3a4dd452";

const metadata = {
  name: "Web3Modal",
  description: "Web3Modal Example",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const chains = [bsc, polygon];
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

createWeb3Modal({ wagmiConfig, projectId, chains });

const WagmiProvider = ({ children }: any) => {
  return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
};

export default WagmiProvider;
