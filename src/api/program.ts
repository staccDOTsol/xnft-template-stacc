import * as anchor from "@project-serum/anchor";
import {
  Cluster,
  Connection,
  Keypair,
  PublicKey,
  TransactionSignature,
} from "@solana/web3.js";
import {
  Mint,
  SwitchboardProgram,
  QueueAccount,
  AnchorWallet,
  TransactionObject,
  SendTransactionOptions,
  DEFAULT_SEND_TRANSACTION_OPTIONS,
  TransactionOptions,
} from "@switchboard-xyz/solana.js/src";
import { HouseState } from "./generated/accounts";
import { House } from "./house";

export class FlipProgram {
  constructor(
    readonly program: anchor.Program,
    readonly house: House,
    readonly mint: Mint,
    readonly queue: QueueAccount
  ) {}

  get idl(): anchor.Idl {
    return this.program.idl;
  }

  get programId(): PublicKey {
    return this.program.programId;
  }

  get switchboard(): SwitchboardProgram {
    return this.queue.program;
  }

  get provider(): anchor.AnchorProvider {
    return this.program.provider as anchor.AnchorProvider;
  }

  get connection(): Connection {
    return this.provider.connection;
  }

  get payer(): Keypair {
    return (this.provider.wallet as AnchorWallet).payer;
  }

  get payerPubkey(): PublicKey {
    return this.payer.publicKey;
  }

  static async init(
    program: anchor.Program,
    switchboardQueue: QueueAccount,
    mintKeypair: Keypair
  ): Promise<FlipProgram> {
    const house = await House.create(program, switchboardQueue, mintKeypair);
    const mint = await house.loadMint();
    return new FlipProgram(program, house, mint, switchboardQueue);
  }

  static async load(
    program: anchor.Program,
    mintPublickey?: PublicKey,
    params?: {
      queuePubkey?: PublicKey;
      mintKeypair?: Keypair;
    }
  ): Promise<FlipProgram> {
    const switchboard = await SwitchboardProgram.fromProvider(
      program.provider as anchor.AnchorProvider
    );

    const [houseKey] = House.fromSeeds(program.programId, mintPublickey, (program.provider as anchor.AnchorProvider).wallet.publicKey);
    const houseState = await HouseState.fetch(
      program.provider.connection,
      houseKey
    );

    // create the house if not created yet
    if (houseState === null) {
      if (!params?.queuePubkey) {
        throw new Error(
          `Must provide queuePubkey to create a new house account`
        );
      }
      const queueAccount = new QueueAccount(switchboard, params.queuePubkey);
      return await FlipProgram.init(
        program,
        queueAccount,
        params?.mintKeypair ? params.mintKeypair : Keypair.generate()
      );
    } else {
      const house = new House(program, houseKey, houseState);
      const mint = await house.loadMint();
      const queueAccount = new QueueAccount(
        switchboard,
        house.state.switchboardQueue
      );
      return new FlipProgram(program, house, mint, queueAccount);
    }
  }

  public async signAndSendAll(
    txns: Array<TransactionObject>,
    opts: SendTransactionOptions = DEFAULT_SEND_TRANSACTION_OPTIONS,
    txnOptions?: TransactionOptions,
    delay = 0
  ): Promise<Array<TransactionSignature>> {
    const signatures = await this.switchboard.signAndSendAll(
      txns,
      opts,
      txnOptions,
      delay
    );
    return signatures;
  }

  public async signAndSend(
    txn: TransactionObject,
    opts: SendTransactionOptions = DEFAULT_SEND_TRANSACTION_OPTIONS,
    txnOptions?: TransactionOptions
  ): Promise<TransactionSignature> {
    const signature = await this.switchboard.signAndSend(txn, opts, txnOptions);
    return signature;
  }
}
