import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { sleep } from "@switchboard-xyz/common";
import {
  Mint,
  QueueAccount,
  SwitchboardProgram,
  TransactionObject,
} from "@switchboard-xyz/solana.js/src";
import { HouseState, HouseStateJSON } from "./generated/accounts";
import { houseInit } from "./generated/instructions";

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
  state: HouseState;

  constructor(
    readonly program: anchor.Program,
    readonly publicKey: PublicKey,
    state: HouseState
  ) {
    this.state = state;
  }

  static fromSeeds(programId: PublicKey,
    mint: PublicKey,
    authority: PublicKey 
    ): [PublicKey, number] {
    return anchor.utils.publicKey.findProgramAddressSync(
      [Buffer.from("HOUSESTATESEED"),
    authority.toBytes(),
  mint.toBytes()],
      programId
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

  getQueueAccount(switchboardProgram: SwitchboardProgram): QueueAccount {
    const queueAccount = new QueueAccount(
      switchboardProgram,
      this.state.switchboardQueue
    );
    return queueAccount;
  }

  static async create(
    program: anchor.Program,
    switchboardQueue: QueueAccount,
    mint: Keypair = anchor.web3.Keypair.generate(),
    houseAuthority: PublicKey = (program.provider as anchor.AnchorProvider).wallet.publicKey
  ): Promise<House> {
    const [initHouse, houseKey] = await House.createReq(
      program,
      switchboardQueue,
      houseAuthority,
      mint
    );

    const signature = await switchboardQueue.program.signAndSend(initHouse, {
      skipPreflight: true,
    });

    let retryCount = 5;
    while (retryCount) {
      const houseState = await HouseState.fetch(
        program.provider.connection,
        houseKey
      );
      if (houseState !== null) {
        return new House(program, houseKey, houseState);
      }
      await sleep(1000);
      --retryCount;
    }

    throw new Error(`Failed to create new HouseAccount`);
  }

  static async createReq(
    program: anchor.Program,
    switchboardQueue: QueueAccount,
    houseAuthority: PublicKey = (program.provider as anchor.AnchorProvider).wallet.publicKey,
    mint: Keypair = anchor.web3.Keypair.generate()
  ): Promise<[TransactionObject, PublicKey]> {
    const payer = switchboardQueue.program.walletPubkey;

    const [houseKey, houseBump] = House.fromSeeds(program.programId, mint.publicKey, houseAuthority);

    const mintPubkey: PublicKey = mint.publicKey;

    const [tokenVault] = anchor.utils.publicKey.findProgramAddressSync(
      [houseKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const initHouse = houseInit(
      { params: {} },
      {
        house: houseKey,
        authority: payer,
        switchboardMint: switchboardQueue.program.mint.address,
        switchboardQueue: switchboardQueue.publicKey,
        mint: mintPubkey,
        houseVault: tokenVault,
        payer: payer,
        hydra: 
           new PublicKey("ADih34mBjvzp5kw6nLvfX5pVdnYAcxGy8arJ4qdGojqW"),
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }
    );

    return [new TransactionObject(payer, [initHouse], [mint]), houseKey];
  }

  static async load(program: anchor.Program,
    mint: PublicKey,
    houseAuthority: PublicKey = (program.provider as anchor.AnchorProvider).wallet.publicKey,
    ): Promise<House> {
    const connection = program.provider.connection;
    
    const [houseKey, houseBump] = House.fromSeeds(program.programId, mint, houseAuthority);

    let houseState = await HouseState.fetch(connection, houseKey);
    if (houseState !== null) {
      return new House(program, houseKey, houseState);
    }

    throw new Error(`House account has not been created yet`);
  }

  static async getOrCreate(
    program: anchor.Program,
    switchboardQueue: QueueAccount,
    params: {
    mint?: Keypair,
    mintPublickey?: PublicKey
    }
  ): Promise<House> {
    try {
      const house = await House.load(program, params.mintPublickey ?? params.mint.publicKey );
      return house;
    } catch (error: any) {
      if (
        !error.toString().includes("House account has not been created yet")
      ) {
        throw error;
      }
    }

    return House.create(program, switchboardQueue, params.mint ?? Keypair.generate());
  }

  async loadMint(): Promise<Mint> {
    const mint = await Mint.load(
      this.program.provider as anchor.AnchorProvider,
      this.state.mint
    );
    return mint;
  }
}
