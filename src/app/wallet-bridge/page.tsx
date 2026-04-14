"use client"

import { useEffect, useRef, useState } from "react"

import { env } from "@/env"

type StatusTone = "loading" | "success" | "error"

type StatusState = {
	tone: StatusTone
	message: string
}

type EthereumProvider = {
	request<T = unknown>(args: { method: string; params?: unknown }): Promise<T>
}

declare global {
	interface Window {
		ethereum?: EthereumProvider
	}
}

const CHAIN_ID_HEX = env.NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_ID_HEX
const CHAIN_PARAMS = {
	chainId: CHAIN_ID_HEX,
	chainName: env.NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_NAME,
	rpcUrls: [env.NEXT_PUBLIC_WALLET_BRIDGE_RPC_URL],
	nativeCurrency: {
		name: env.NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_NAME,
		symbol: env.NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_SYMBOL,
		decimals: env.NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_DECIMALS,
	},
	blockExplorerUrls: [env.NEXT_PUBLIC_WALLET_BRIDGE_BLOCK_EXPLORER_URL],
}

function getErrorCode(error: unknown): number | undefined {
	if (typeof error !== "object" || error === null) return undefined
	const candidate = error as { code?: unknown }
	return typeof candidate.code === "number" ? candidate.code : undefined
}

async function ensureNetwork(ethereum: EthereumProvider) {
	const currentChain = await ethereum.request<string>({ method: "eth_chainId" })
	if (currentChain?.toLowerCase() === CHAIN_ID_HEX.toLowerCase()) return

	try {
		await ethereum.request({
			method: "wallet_switchEthereumChain",
			params: [{ chainId: CHAIN_ID_HEX }],
		})
		return
	} catch (error) {
		if (getErrorCode(error) !== 4902) throw error
	}

	await ethereum.request({
		method: "wallet_addEthereumChain",
		params: [CHAIN_PARAMS],
	})

	await ethereum.request({
		method: "wallet_switchEthereumChain",
		params: [{ chainId: CHAIN_ID_HEX }],
	})
}

export default function WalletBridgePage() {
	const [status, setStatus] = useState<StatusState>({
		tone: "loading",
		message: "Connecting wallet...",
	})
	const [address, setAddress] = useState<string | null>(null)
	const startedRef = useRef(false)

	useEffect(() => {
		if (startedRef.current) return
		startedRef.current = true

		const run = async () => {
			try {
				const ethereum = window.ethereum
				if (!ethereum) {
					setStatus({ tone: "error", message: "Please open this page inside MetaMask" })
					return
				}

				const accounts = await ethereum.request<string[]>({ method: "eth_requestAccounts" })
				const walletAddress = accounts[0]

				if (!walletAddress) {
					setStatus({ tone: "error", message: "Connection rejected" })
					return
				}

				setAddress(walletAddress)
				setStatus({ tone: "loading", message: "Setting Wirefluid network..." })

				await ensureNetwork(ethereum)

				setStatus({ tone: "success", message: "Wallet connected and network set" })
			} catch (error) {
				const code = getErrorCode(error)
				if (code === 4001) {
					setStatus({ tone: "error", message: "User rejected request" })
					return
				}
				setStatus({ tone: "error", message: "Network setup failed" })
			}
		}

		void run()
	}, [])

	const isLoading = status.tone === "loading"

	return (
		<main className="min-h-screen bg-[#06111f] text-white flex items-center justify-center px-6">
			<section className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/8 p-6 text-center">
				<div
					className={`mx-auto h-10 w-10 rounded-full border-4 border-white/20 border-t-cyan-300 ${
						isLoading ? "animate-spin" : ""
					}`}
				/>
				<h1 className="mt-4 text-xl font-semibold">Wallet Bridge</h1>
				<p className="mt-2 text-white/80">{status.message}</p>
				{address ? (
					<p className="mt-4 text-sm text-emerald-200">
						{address.slice(0, 6)}...{address.slice(-4)}
					</p>
				) : null}
			</section>
		</main>
	)
}
