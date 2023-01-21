import * as anchor from "@coral-xyz/anchor";
import * as spl from "../spl-token";
import {
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { sleep } from "@switchboard-xyz/sbv2-utils/lib/cjs";
import {
  OracleQueueAccount,
  programWallet,
} from "@switchboard-xyz/switchboard-v2/lib/cjs";
import { HouseState, HouseStateJSON } from "./generated/accounts";
import { FlipProgram } from "./types";

export class HouseAccountDoesNotExist extends Error {
  readonly name = "HouseAccountDoesNotExist";
  readonly msg = "Failed to fetch the HouseState account.";

  constructor() {
    super("HouseAccountDoesNotExist: Failed to fetch the HouseState account.");
  }
}

export interface HouseJSON extends HouseStateJSON {
  publicKey: string;
}

export class House {
  program: FlipProgram;
  publicKey: PublicKey;
  state: HouseState;

  constructor(program: FlipProgram, publicKey: PublicKey, state: HouseState) {
    this.program = program;
    this.publicKey = publicKey;
    this.state = state;
  }

  static fromSeeds(program: FlipProgram, mint: PublicKey): [PublicKey, number] {
    return anchor.utils.publicKey.findProgramAddressSync(
      [Buffer.from("HOUSESTATESEED"), mint.toBuffer()],
      program.programId
    );
  }

  async reload(): Promise<void> {
    const newState = await HouseState.fetch(
      this.program.provider.connection,
      this.publicKey
    );
    if (newState === null) {
      throw new Error(`Failed to fetch the new House account state`);
    }
    this.state = newState;
  }

  toJSON(): HouseJSON {
    return {
      publicKey: this.publicKey.toString(),
      ...this.state.toJSON(),
    };
  }

  getQueueAccount(switchboardProgram: anchor.Program): OracleQueueAccount {
    const queueAccount = new OracleQueueAccount({
      program: switchboardProgram as any,
      publicKey: this.state.switchboardQueue,
    });
    return queueAccount;
  }

  static async create(
    program: FlipProgram,
    switchboardQueue: OracleQueueAccount,
    mintKeypair: PublicKey
  ): Promise<House> {
    console.log(switchboardQueue.publicKey.toBase58())
    const req = await House.createReq(program, switchboardQueue, mintKeypair);

    const signature = await program.provider.sendAndConfirm!(
      new Transaction().add(...req.ixns),
      req.signers
    );

    let retryCount = 5;
    while (retryCount) {
      const houseState = await HouseState.fetch(
        program.provider.connection,
        req.account
      );
      if (houseState !== null) {
        return new House(program, req.account, houseState);
      }
      await sleep(1000);
      --retryCount;
    }

    throw new Error(`Failed to create new HouseAccount`);
  }

  static async createReq(
    program: FlipProgram,
    switchboardQueue: OracleQueueAccount,
    mintKeypair :PublicKey
  ): Promise<{
    ixns: TransactionInstruction[];
    signers: Signer[];
    account: PublicKey;
  }> {
    const payer = programWallet(program as any);
    const [houseKey, houseBump] = House.fromSeeds(program,mintKeypair);

    const switchboardMint = await switchboardQueue.loadMint();
console.log(switchboardMint.address.toBase58())
    const tokenVault = await spl.getAssociatedTokenAddress(
      mintKeypair,
      houseKey,
      true
    );
      const hydra = new PublicKey("JAcF8pPFvGrRCgbe2kAoEPXcgPVoLPNiC3Loz628C8sT")
    const txnIxns: TransactionInstruction[] = [
      await program.methods
        .houseInit({})
        .accounts({
          hydra: hydra,
          house: houseKey,
          authority: payer.publicKey,
          switchboardMint: switchboardMint.address,
          switchboardQueue: switchboardQueue.publicKey,
          mint: mintKeypair,
          houseVault: tokenVault,
          payer: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .instruction(),
    ];

    return {
      ixns: txnIxns,
      signers: [],
      account: houseKey,
    };
  }

  static async load(program: FlipProgram, mint: PublicKey): Promise<House> {
    const connection = program.provider.connection;
    const [houseKey, houseBump] = House.fromSeeds(program, mint);
    console.log(houseKey.toBase58())
    const payer = programWallet(program as any);

    let houseState = await HouseState.fetch(connection, houseKey);
    if (houseState !== null) {
      return new House(program, houseKey, houseState);
    }

    throw new Error(`House account has not been created yet`);
  }

  static async getOrCreate(
    program: FlipProgram,
    mint: PublicKey,
    switchboardQueue: OracleQueueAccount
  ): Promise<House> {
    try {
      const house = await House.load(program, new PublicKey(mint));
      return house;
    } catch (error: any) {
      if (
        !error.toString().includes("House account has not been created yet")
      ) {
        throw error;
      }
    }

    return House.create(program, switchboardQueue, mint);
  }

  async loadMint(): Promise<spl.Mint> {
    const mint = await spl.getMint(
      this.program.provider.connection,
      this.state.mint
    );
    return mint;
  }
}
