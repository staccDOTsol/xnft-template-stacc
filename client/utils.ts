import * as anchor from "@project-serum/anchor";
import * as Token from "../spl-token";
import { Keypair } from "@solana/web3.js";
import {
  AnchorWallet,
  QueueAccount,
  SwitchboardProgram,
} from "../../solana.js";
import { Big } from "@switchboard-xyz/common";
import { PROGRAM_ID_CLI } from "./generated/programId";
import { FlipProgram } from "./program";
import { User } from "./user";
import path from "path";
import fs from "fs";
import os from "os";
import { createWrappedNativeAccount } from "../spl-token";

const DEFAULT_COMMITMENT = "confirmed";

export function programWallet(program: anchor.Program): Keypair {
  return ((program.provider as anchor.AnchorProvider).wallet as AnchorWallet)
    .payer;
}

export const defaultRpcForCluster = (
  cluster: anchor.web3.Cluster | "localnet"
) => {
  switch (cluster) {
    case "mainnet-beta":
      return "https://rpc.helius.xyz/?api-key=6b1ccd35-ba2d-472a-8f54-9ac2c3c40b8b";
    case "devnet":
      return "https://api.devnet.solana.com";
    case "localnet":
      return "http://localhost:8899";
    default:
      throw new Error(`Failed to find RPC_URL for cluster ${cluster}`);
  }
};

export interface FlipUser {
  keypair: anchor.web3.Keypair;
  switchboardProgram: SwitchboardProgram;
  switchTokenWallet: anchor.web3.PublicKey;
  user: User;
}

export async function getFlipProgram(
  rpcEndpoint: string,
  provider: anchor.AnchorProvider = window.xnft?.solana || new anchor.AnchorProvider(
    new anchor.web3.Connection("https://rpc.helius.xyz/?api-key=6b1ccd35-ba2d-472a-8f54-9ac2c3c40b8b", { commitment: DEFAULT_COMMITMENT }),
    new AnchorWallet(anchor.web3.Keypair.generate()),
    { commitment: DEFAULT_COMMITMENT }
  )
): Promise<anchor.Program> {
  const programId = new anchor.web3.PublicKey(PROGRAM_ID_CLI);

  const idl = await anchor.Program.fetchIdl(programId, provider);
  if (!idl)
    throw new Error(
      `Failed to find IDL for program [ ${programId.toBase58()} ]`
    );

  return new anchor.Program(
    idl,
    programId,
    provider,
    new anchor.BorshCoder(idl)
  );
}

export async function createFlipUser(
  program: FlipProgram,
  wSolAmount = 0.2
): Promise<FlipUser> {
  const switchboardProgram = program.switchboard;

  const keypair = anchor.web3.Keypair.generate();
  const airdropTxn = await program.provider.connection.requestAirdrop(
    keypair.publicKey,
    1 * anchor.web3.LAMPORTS_PER_SOL
  );
  await program.provider.connection.confirmTransaction(airdropTxn);

  const provider = new anchor.AnchorProvider(
    switchboardProgram.provider.connection,
    new AnchorWallet(keypair),
    {}
  );
  const flipAnchorProgram = new anchor.Program(
    program.idl,
    program.programId,
    provider
  );

  // const newSwitchboardProgram = await SwitchboardProgram.fromProvider(provider);
  const newSwitchboardProgram = new SwitchboardProgram(
    // @ts-ignore
    new anchor.Program(
      program.switchboard.idl,
      program.switchboard.programId,
      provider
    ),
    program.switchboard.cluster,
    program.switchboard.mint
  );

  const switchTokenWallet =
    wSolAmount > 0
      ? await createWrappedNativeAccount(
          newSwitchboardProgram.provider.connection,
          keypair,
          keypair.publicKey,
          wSolAmount * anchor.web3.LAMPORTS_PER_SOL
        )
      : newSwitchboardProgram.mint.getAssociatedAddress(keypair.publicKey);

  const flipProgram = new FlipProgram(
    flipAnchorProgram,
    program.house,
    program.mint,
    new QueueAccount(newSwitchboardProgram, program.queue.publicKey) // rebuild the queue with the new switchboard program + provider
  );

  const user = await User.create(flipProgram);

  return {
    keypair,
    switchboardProgram: newSwitchboardProgram,
    switchTokenWallet,
    user,
  };
}

export const tokenAmountToBig = (tokenAmount: anchor.BN, decimals = 2): Big => {
  const bigTokenAmount = new Big(tokenAmount.toString(10));

  const denominator = new Big(10).pow(decimals);
  const oldDp = Big.DP;
  Big.DP = 20;
  const result = bigTokenAmount.div(denominator);
  Big.DP = oldDp;
  return result;
};

export const verifyPayerBalance = async (
  connection: anchor.web3.Connection,
  payer: anchor.web3.PublicKey,
  minAmount = 0.1 * anchor.web3.LAMPORTS_PER_SOL,
  currentBalance?: number
): Promise<void> => {
  if (connection.rpcEndpoint === defaultRpcForCluster("devnet")) {
    connection = new anchor.web3.Connection(
      anchor.web3.clusterApiUrl("devnet")
    );
  }
  const payerBalance = currentBalance ?? (await connection.getBalance(payer));
  if (payerBalance > minAmount) {
    return console.log(
      `Payer has sufficient funds, ${
        payerBalance / anchor.web3.LAMPORTS_PER_SOL
      } > ${minAmount / anchor.web3.LAMPORTS_PER_SOL}`
    );
  }

  try {
    console.log(`Requesting airdrop for user ${payer.toBase58()}`);
    const AIRDROP_AMT = 1 * anchor.web3.LAMPORTS_PER_SOL;
    const airdropTxn = await connection.requestAirdrop(payer, AIRDROP_AMT);
    await connection.confirmTransaction(airdropTxn);
  } catch (error) {
    console.log(`Failed to request an airdrop`);
    console.error(error);
  }
};

export function findAnchorTomlWallet(workingDir = process.cwd()): string {
  let numDirs = 3;
  while (numDirs) {
    const filePath = path.join(workingDir, "Anchor.toml");
    if (fs.existsSync(filePath)) {
      const fileString = fs.readFileSync(filePath, "utf-8");
      const matches = Array.from(
        fileString.matchAll(new RegExp(/wallet = "(?<wallet_path>.*)"/g))
      );
      // @ts-ignore
      if (matches && matches.length > 0 && matches[0].groups["wallet_path"]) {
        // @ts-ignore
        const walletPath = matches[0].groups["wallet_path"];
        return walletPath.startsWith("/") ||
          walletPath.startsWith("C:") ||
          walletPath.startsWith("D:")
          ? walletPath
          : walletPath.startsWith("~")
          ? path.join(os.homedir(), walletPath.slice(1))
          : path.join(process.cwd(), walletPath);
      }
    }

    workingDir = path.dirname(workingDir);
    --numDirs;
  }

  throw new Error(`Failed to find wallet path in Anchor.toml`);
}
