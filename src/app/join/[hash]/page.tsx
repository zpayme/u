/* eslint-disable @next/next/no-img-element */
"use client";

import { shortenAddress } from "@/utils";
import ABI from "@/utils/token.json";
import ZpayABI from "@/utils/zpay.json";
import { disconnect, getContract, waitForTransaction } from "@wagmi/core";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useNetwork, useSwitchNetwork, useWalletClient } from "wagmi";
import { decodeSubscription, setChain, tokenDetails } from "zpayme";

export default function Join({ params: { hash } }: { params: { hash: string } }) {
  const { chain } = useNetwork();
  const { data: walletClient } = useWalletClient();
  const [decoded, setDecoded] = useState(false);
  const [decoding, setDecoding] = useState(true);
  const [subscribed, setSubscribed] = useState(false);

  const { switchNetworkAsync } = useSwitchNetwork();

  const { isConnected, address } = useAccount();

  const [subscription, setSubscription] = useState({
    boss: null,
    cost: 0,
    initDays: 0,
    network: 56,
    token: "",
    tokenAddress: "",
  });

  const [tokenDetail, setTokenDetail] = useState({
    name: "",
    symbol: "",
    decimal: 18,
  });

  const { open } = useWeb3Modal();

  useEffect(() => {
    if (hash) {
      decodeHash(hash);
    }
  }, [hash]);

  async function setNetwork() {
    if (chain && chain.id !== subscription.network) {
      await switchNetworkAsync?.(subscription.network);
    }
  }

  async function decodeHash(hash: string) {
    try {
      const decoded = await decodeSubscription(hash || null);

      await setChain(decoded.network);

      const token = await tokenDetails(decoded.token);
      setTokenDetail(token);
      setSubscription({
        boss: decoded.boss,
        cost: decoded.cost,
        initDays: decoded.initdays,
        network: decoded.network,
        token: token.symbol,
        tokenAddress: decoded.token,
      });
      setDecoded(true);
    } catch (e) {
      console.log(e);
      setDecoded(false);
    }
    setDecoding(false);
  }
  // "0x21533A574EC5E3Bda5aCd773d02Ec92a5bd1a3eC"

  async function approveToken() {
    try {
      const contract = getContract({
        address: subscription.tokenAddress as any,
        abi: ABI,
        walletClient: walletClient as any,
      }) as any;
      const amount = parseUnits((subscription.cost * 365 * 10).toString(), tokenDetail.decimal);

      const allowance = await contract.read.allowance([address, subscription.boss]);
      if (allowance < amount) {
        const approved = await contract.write.approve([subscription.tokenAddress, amount]);
        await waitForTransaction({
          hash: approved,
        });
      }

      const zpayContract = getContract({
        address: "0x21533A574EC5E3Bda5aCd773d02Ec92a5bd1a3eC",
        abi: ZpayABI,
        walletClient: walletClient as any,
      }) as any;

      const subs = await zpayContract.write.subscriptionCreate([subscription.tokenAddress, subscription.boss, amount, subscription.initDays || 0], {
        gasLimit: 300000,
      });
      await waitForTransaction({
        hash: subs,
      });
      setSubscribed(true);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-24 px-8">
      <div className="mx-auto font-bold my-40">
        {decoding ? (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/loading.gif" className=" h-40 mb-8" alt="invalid" />
            <div className="text-xl text-green-400">Decoding Subscription...</div>
          </div>
        ) : !decoded ? (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/invalid-sub.png" className=" h-40 mb-8" alt="invalid" />
            <div className="text-xl text-red-600">Invalid Subscription</div>
          </div>
        ) : (
          <div>
            {!isConnected && (
              <div className="max-w-6xl text-center	">
                <div className="my-4">
                  <p className="text-2xl">Connect your wallet to subscribe to {shortenAddress(subscription.boss || "")}</p>
                </div>
                <button onClick={() => open()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-lg w-[250px]">
                  Connect Wallet
                </button>
              </div>
            )}
            {isConnected && (
              <div className="max-w-5xl text-center	">
                <div className="my-4">
                  <p className="text-3xl">
                    You are subscribing to {shortenAddress(subscription.boss || "")} for {subscription.cost} {subscription.token} per day.
                  </p>
                </div>
                <div className="mt-4">
                  {chain && chain.id !== Number(subscription.network) && (
                    <button className="bg-blue-600 hover:bg-blue-800 text-white py-2 px-4 rounded-lg text-lg w-[250px]" onClick={() => setNetwork()}>
                      Switch Network
                    </button>
                  )}
                  {chain && chain.id === Number(subscription.network) && (
                    <button
                      className="bg-green-600 hover:bg-green-800 text-white py-2 px-4 rounded-lg text-lg w-[250px]"
                      onClick={() => approveToken()}
                    >
                      Subscribe
                    </button>
                  )}
                  <div>
                    {subscribed && (
                      <div className="text-2xl mt-4">
                        <p>Successfully Subscribed!</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm">
                      Connected with {shortenAddress(address || "")} to <span className="italic">{chain.name}</span>.
                    </p>
                    <button className="text-sm underline" onClick={async () => await disconnect()}>
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
