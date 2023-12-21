/* eslint-disable @next/next/no-img-element */
"use client";

import { shortenAddress } from "@/utils";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useState } from "react";
import { useAccount, useNetwork } from "wagmi";
import { encodeSubscription, setChain } from "zpayme";

export default function Join({ params: { receiver, cost, init } }: { params: { receiver: string; cost: string; init: string } }) {
  const { chain } = useNetwork();

  const [badNetwork, setBadNetwork] = useState(false);

  const { isConnected } = useAccount();

  const { open } = useWeb3Modal();

  useEffect(() => {
    if (chain) {
      decodeSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain]);

  async function decodeSubscription() {
    try {
      if ([56, 137].indexOf(chain.id) === -1) {
        setBadNetwork(true);
      } else {
        setBadNetwork(false);
      }
      await setChain(chain.id);
      const tokenAddress = chain.id === 56 ? "0x55d398326f99059fF775485246999027B3197955" : "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
      const decode = await encodeSubscription(chain.id, receiver, tokenAddress, cost, init);
      window.location.href = `/join/${decode.hash}`;
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-24 px-8">
      <div className="mx-auto font-bold my-40">
        <div>
          {!isConnected && (
            <div className="max-w-6xl text-center	">
              <div className="my-4">
                <p className="text-2xl">Connect your wallet to subscribe to {shortenAddress(receiver || "")}</p>
              </div>
              <button onClick={() => open()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-lg w-[250px]">
                Connect Wallet
              </button>
            </div>
          )}
          {isConnected && chain && (
            <div className="max-w-5xl text-center	">
              <div className="my-4">
                <p className="text-3xl">You are connected to {chain.name}.</p>
              </div>
              <div className="mt-4">
                {chain && badNetwork && (
                  <button
                    className="bg-blue-600 hover:bg-blue-800 text-white py-2 px-4 rounded-lg text-lg w-[250px]"
                    onClick={() => open({ view: "Networks" })}
                  >
                    Switch Network
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
