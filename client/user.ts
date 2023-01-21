import * as anchor from "@coral-xyz/anchor";
import * as spl from "../spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { promiseWithTimeout, sleep } from "@switchboard-xyz/sbv2-utils/lib/cjs";
import {
  Callback,
  OracleQueueAccount,
  packTransactions,
  PermissionAccount,
  ProgramStateAccount,
  SwitchboardProgram,
  VrfAccount,
} from "@switchboard-xyz/switchboard-v2/lib/cjs";
import { UserState, UserStateJSON } from "./generated/accounts";
import { House } from "./house";
import { loadSwitchboard, loadVrfContext } from "./switchboard";
import {
  convertGameType,
  FlipProgram,
  GameTypeEnum,
  GameTypeValue,
} from "./types";
import { verifyPayerBalance } from "./utils";

export interface UserBetPlaced {
  roundId: anchor.BN;
  user: PublicKey;
  gameType: GameTypeEnum;
  betAmount: anchor.BN;
  guess: number;
  slot: number;
  timestamp: anchor.BN;
}

export interface UserBetSettled {
  roundId: anchor.BN;
  user: PublicKey;
  userWon: boolean;
  gameType: GameTypeEnum;
  betAmount: anchor.BN;
  escrowChange: anchor.BN;
  guess: number;
  result: number;
  slot: number;
  timestamp: anchor.BN;
}

export interface UserJSON extends UserStateJSON {
  publicKey: string;
}

const VRF_REQUEST_AMOUNT = new anchor.BN(2000000);

export class User {
  program: FlipProgram;
  publicKey: PublicKey;
  state: UserState;
  private readonly _programEventListeners: number[] = [];

  constructor(program: FlipProgram, publicKey: PublicKey, state: UserState) {
    this.program = program;
    this.publicKey = publicKey;
    this.state = state;
  }

  static async load(program: FlipProgram, authority: PublicKey, mint: PublicKey): Promise<User> {
    const [houseKey] = House.fromSeeds(program, mint);
    const [userKey] = User.fromSeeds(program, houseKey, authority);
    const userState = await UserState.fetch(
      window.xnft.solana.connection,
      userKey
    );
    if (!userState) {
      throw new Error(`User account does not exist`);
    }
    return new User(program, userKey, userState);
  }

  static async getOrCreate(
    program: FlipProgram,
    authority: PublicKey,
    switchboardProgram: SwitchboardProgram,
    mint: PublicKey,
  ): Promise<User> {
    try {
      const user = await User.load(program, authority, mint);
      return user;
    } catch (error) {}
// @ts-ignore
    return User.create(program, switchboardProgram, mint);
  }

 getVrfAccount(switchboardProgram: anchor.Program): VrfAccount {
    const vrfAccount = new VrfAccount({
      program: switchboardProgram as any,
      publicKey: this.state.vrf,
    });
    return vrfAccount;
  }

  async getQueueAccount(
    switchboardProgram: anchor.Program
  ): Promise<OracleQueueAccount> {
    const vrfAccount = this.getVrfAccount(switchboardProgram);
    const vrfState = await vrfAccount.loadData();
    const queueAccount = new OracleQueueAccount({
      program: switchboardProgram as any,
      publicKey: vrfState.oracleQueue,
    });
    return queueAccount;
  }

  static fromSeeds(
    program: FlipProgram,
    housePubkey: PublicKey,
    authority: PublicKey
  ): [PublicKey, number] {
    return anchor.utils.publicKey.findProgramAddressSync(
      [
        Buffer.from("USERSTATESEED"),
        housePubkey.toBytes(),
        authority.toBytes(),
      ],
      program.programId
    );
  }

  async reload(): Promise<void> {
    const newState = await UserState.fetch(
      window.xnft.solana.connection,
      this.publicKey
    );
    if (newState === null) {
      throw new Error(`Failed to fetch the new User account state`);
    }
    this.state = newState;
  }

  toJSON(): UserJSON {
    return {
      publicKey: this.publicKey.toString(),
      ...this.state.toJSON(),
    };
  }

  static async getCallback(
    program: FlipProgram,
    house: House,
    user: PublicKey,
    escrow: PublicKey,
    vrf: PublicKey,
    rewardAddress: PublicKey
  ): Promise<Callback> {
    const ixnCoder = new anchor.BorshInstructionCoder(program.idl);
    let connection = new Connection("https://rpc.helius.xyz/?api-key=6b1ccd35-ba2d-472a-8f54-9ac2c3c40b8b")
    let atas = await connection.getTokenAccountsByOwner(house.state.hydra, {mint: house.state.mint})
    const callback: Callback = {
      programId: program.programId,
      ixData: ixnCoder.encode("userSettle", {}),
      accounts: [
        {
          pubkey: user,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: house.publicKey,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: escrow,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: rewardAddress,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: house.state.houseVault,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: vrf,
          isWritable: false,
          isSigner: false,
        },
       
        {
          pubkey: atas.value[0].pubkey,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: spl.TOKEN_PROGRAM_ID,
          isWritable: false,
          isSigner: false,
        },
      ],
    };
    return callback;
  }

  static async create(
    program: FlipProgram,
    switchboardProgram: anchor.Program,
    mint: PublicKey
  ): Promise<User> {
    const req = await User.createReq(program, switchboardProgram, new PublicKey(mint));

    const packedTxns = await packTransactions(
      window.xnft.solana.connection,
      [new Transaction().add(...req.ixns)],
      req.signers as Keypair[],
      window.xnft.solana.publicKey
    );

    const signedTxs = await (
      window.xnft.solana
    ).wallet.signAllTransactions(packedTxns);
    const promises = [];
    const sigs: string[] = [];
    for (let k = 0; k < packedTxns.length; k += 1) {
      const sig = await window.xnft.solana.connection.sendRawTransaction(
        signedTxs[k].serialize(),
        // req.signers,
        {
          skipPreflight: false,
          maxRetries: 10,
        }
      );
      await window.xnft.solana.connection.confirmTransaction(sig);
      sigs.push(sig);
    }

    let retryCount = 5;
    while (retryCount) {
      const userState = await UserState.fetch(
        window.xnft.solana.connection,
        req.account
      );
      if (userState !== null) {
        return new User(program, req.account, userState);
      }
      await sleep(1000);
      --retryCount;
    }

    throw new Error(`Failed to create new UserAccount`);
  }

  static async createReq(
    program: FlipProgram,
    switchboardProgram: anchor.Program,
    mint: PublicKey,
    payerPubkey = window.xnft.solana.publicKey,
  ): Promise<{
    ixns: TransactionInstruction[];
    signers: Signer[];
    account: PublicKey;
  }> {
    try {
      await verifyPayerBalance(
        window.xnft.solana.connection,
        payerPubkey,
        0.3 * LAMPORTS_PER_SOL
      );
    } catch {}

    const house = await House.load(program, new PublicKey(mint));
    const flipMint = await house.loadMint();

    const switchboardQueue = house.getQueueAccount(switchboardProgram);
    const switchboardMint = await switchboardQueue.loadMint();

    const escrowKeypair = anchor.web3.Keypair.generate();
    const vrfSecret = anchor.web3.Keypair.generate();

    const [userKey, userBump] = User.fromSeeds(
      program,
      house.publicKey,
      payerPubkey
    );
    const rewardAddress = await spl.getAssociatedTokenAddress(
      flipMint.address,
      payerPubkey,
      true
    );

    const [programStateAccount, stateBump] = ProgramStateAccount.fromSeed(
      switchboardProgram as any
    );
    const queue = await switchboardQueue.loadData();

    const callback = await User.getCallback(
      program,
      house,
      userKey,
      escrowKeypair.publicKey,
      vrfSecret.publicKey,
      rewardAddress
    );

    const [permissionAccount, permissionBump] = PermissionAccount.fromSeed(
      switchboardProgram as any,
      queue.authority,
      switchboardQueue.publicKey,
      vrfSecret.publicKey
    );

    const vrfEscrow = await spl.getAssociatedTokenAddress(
      switchboardMint.address,
      vrfSecret.publicKey,
      true
    );

    const txnIxns: TransactionInstruction[] = [
      // create VRF account
      spl.createAssociatedTokenAccountInstruction(
        payerPubkey,
        vrfEscrow,
        vrfSecret.publicKey,
        switchboardMint.address
      ),
      spl.createSetAuthorityInstruction(
        vrfEscrow,
        vrfSecret.publicKey,
        spl.AuthorityType.AccountOwner,
        programStateAccount.publicKey
      ),
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: payerPubkey,
        newAccountPubkey: vrfSecret.publicKey,
        space: switchboardProgram.account.vrfAccountData.size,
        lamports:
          await window.xnft.solana.connection.getMinimumBalanceForRentExemption(
            switchboardProgram.account.vrfAccountData.size
          ),
        programId: switchboardProgram.programId,
      }),
      await switchboardProgram.methods
        .vrfInit({
          stateBump,
          callback: callback,
        })
        .accounts({
          vrf: vrfSecret.publicKey,
          escrow: vrfEscrow,
          authority: userKey,
          oracleQueue: switchboardQueue.publicKey,
          programState: programStateAccount.publicKey,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
        })
        .instruction(),
      // create permission account
      await switchboardProgram.methods
        .permissionInit({})
        .accounts({
          permission: permissionAccount.publicKey,
          authority: queue.authority,
          granter: switchboardQueue.publicKey,
          grantee: vrfSecret.publicKey,
          payer: payerPubkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction(),
      // create user account
      await program.methods
        .userInit({
          switchboardStateBump: stateBump,
          vrfPermissionBump: permissionBump,
        })
        .accounts({
          user: userKey,
          house: house.publicKey,
          mint: flipMint.address,
          authority: payerPubkey,
          escrow: escrowKeypair.publicKey,
          rewardAddress: rewardAddress,
          vrf: vrfSecret.publicKey,
          payer: payerPubkey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .instruction(),
    ];

    return {
      ixns: txnIxns,
      signers: [vrfSecret, escrowKeypair],
      account: userKey,
    };
  }

  async placeBet(
    gameType: GameTypeValue,
    userGuess: number,
    betAmount: anchor.BN,
    switchboardTokenAccount?: PublicKey,
    payerPubkey = window.xnft.solana.publicKey
  ): Promise<string> {
    const req = await this.placeBetReq(
      gameType,
      userGuess,
      new anchor.BN(betAmount.toNumber() / 2),
      switchboardTokenAccount as PublicKey,
      payerPubkey
    );

    const signature = await this.program.provider.sendAndConfirm!(
      new Transaction().add(...req.ixns),
      req.signers
    );

    return signature;
  }

  async placeBetReq(
    gameType: GameTypeValue,
    userGuess: number,
    betAmount: anchor.BN,
    mint: PublicKey,
    switchboardTokenAccount?: PublicKey,
    payerPubkey = window.xnft.solana.publicKey
  ): Promise<{ ixns: TransactionInstruction[]; signers: Signer[] }> {
    try {
      await verifyPayerBalance(window.xnft.solana.connection, payerPubkey);
    } catch {}

    const signers: Signer[] = [];
    const ixns: TransactionInstruction[] = [];
    const house = await House.load(this.program, new PublicKey(mint));

    const switchboard = await loadSwitchboard(
      window.xnft.solana
    );
    const vrfContext = await loadVrfContext(switchboard, this.state.vrf);

    let payersWrappedSolBalance: anchor.BN;
    let payerSwitchTokenAccount: PublicKey;
    if (switchboardTokenAccount) {
      payerSwitchTokenAccount = switchboardTokenAccount;
      payersWrappedSolBalance = new anchor.BN(
        (
          await window.xnft.solana.connection.getTokenAccountBalance(
            switchboardTokenAccount
          )
        ).value.amount
      );
    } else {
      payerSwitchTokenAccount = await spl.getAssociatedTokenAddress(
        spl.NATIVE_MINT,
        payerPubkey
      );

      const payersWrappedSolAccountInfo =
        await window.xnft.solana.connection.getAccountInfo(
          payerSwitchTokenAccount
        );
      if (payersWrappedSolAccountInfo === null) {
        ixns.push(
          spl.createAssociatedTokenAccountInstruction(
            payerPubkey,
            payerSwitchTokenAccount,
            payerPubkey,
            spl.NATIVE_MINT
          )
        );
        payersWrappedSolBalance = new anchor.BN(0);
      } else {
        const tokenAccount = spl.AccountLayout.decode(
          payersWrappedSolAccountInfo.data
        );
        payersWrappedSolBalance = new anchor.BN(
          tokenAccount.amount.toString(10)
        );
      }
    }

    // check VRF escrow balance
    const vrfEscrowBalance = new anchor.BN(
      (
        await window.xnft.solana.connection.getTokenAccountBalance(
          vrfContext.publicKeys.vrfEscrow
        )
      ).value.amount
    );

    const combinedWrappedSolBalance =
      payersWrappedSolBalance.add(vrfEscrowBalance);

    if (combinedWrappedSolBalance.lt(VRF_REQUEST_AMOUNT)) {
      const wrapAmount = VRF_REQUEST_AMOUNT.sub(combinedWrappedSolBalance);

      const ephemeralAccount = Keypair.generate();
      const ephemeralWallet = await spl.getAssociatedTokenAddress(
        spl.NATIVE_MINT,
        ephemeralAccount.publicKey,
        false
      );

      signers.push(ephemeralAccount);
      ixns.push(
        spl.createAssociatedTokenAccountInstruction(
          payerPubkey,
          ephemeralWallet,
          ephemeralAccount.publicKey,
          spl.NATIVE_MINT
        ),
        SystemProgram.transfer({
          fromPubkey: payerPubkey,
          toPubkey: ephemeralWallet,
          lamports: wrapAmount.toNumber(),
        }),
        spl.createSyncNativeInstruction(ephemeralWallet),
        spl.createTransferInstruction(
          ephemeralWallet,
          vrfContext.publicKeys.vrfEscrow,
          ephemeralAccount.publicKey,
          wrapAmount.toNumber()
        ),
        spl.createCloseAccountInstruction(
          ephemeralWallet,
          payerPubkey,
          ephemeralAccount.publicKey
        )
      );
    }

    ixns.push(
      await this.program.methods
        .userBet({
          gameType: gameType,
          userGuess,
          betAmount,
        })
        .accounts({
          user: this.publicKey,
          house: this.state.house,
          houseVault: house.state.houseVault,
          authority: this.state.authority,
          escrow: this.state.escrow,
          vrfPayer: payerSwitchTokenAccount,
          ...vrfContext.publicKeys,
          payer: payerPubkey,
          flipPayer: this.state.rewardAddress,
          recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
        })
        .instruction()
    );

    return { ixns, signers };
  }

  async awaitFlip(
    expectedCounter: anchor.BN,
    timeout = 30
  ): Promise<UserState> {
    let accountWs: number;
    const awaitUpdatePromise = new Promise(
      (resolve: (value: UserState) => void) => {
        accountWs = window.xnft.solana.connection.onAccountChange(
          this.publicKey,
          async (accountInfo: any) => {
            const user = UserState.decode(accountInfo.data);
            if (!expectedCounter.eq(user.currentRound.roundId)) {
              return;
            }
            if (user.currentRound.result === 0) {
              return;
            }
            resolve(user);
          }
        );
      }
    ); 

    const result = await promiseWithTimeout(
      timeout * 1000,
      awaitUpdatePromise,
      new Error(`flip user failed to update in ${timeout} seconds`)
    ).finally(() => {
      if (accountWs) {
        window.xnft.solana.connection.removeAccountChangeListener(accountWs);
      }
    });

    if (!result) {
      throw new Error(`failed to update flip user`);
    }

    return result;
  }

  async placeBetAndAwaitFlip(
    gameType: GameTypeValue,
    userGuess: number,
    betAmount: anchor.BN,
    switchboardTokenAccount?: PublicKey,
    timeout = 30
  ): Promise<UserState> {
    await this.reload();
    console.log(this.state)
    const currentCounter = this.state.currentRound.roundId;

    try {
      const placeBetTxn = await this.placeBet(
        gameType,
        userGuess,
        betAmount,
        switchboardTokenAccount
      );
    } catch (error) {
      console.error(error);
      throw error;
    }

    try {
      const userState = await this.awaitFlip(
        currentCounter.add(new anchor.BN(1)),
        timeout
      );
      return userState;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  isWinner(userState?: UserState): boolean {
    let state = userState;
    if (!state){
      state = this.state
    }
    if (state.currentRound.result === 0) {
      return false;
    }
    return state.currentRound.guess === state.currentRound.result;
  }

  async airdropReq(payerPubkey = window.xnft.solana.publicKey, mint: PublicKey) {
    try {
      await verifyPayerBalance(window.xnft.solana.connection, payerPubkey);
    } catch {}

    const house = await House.load(this.program, new PublicKey(mint));
    const flipMint = await house.loadMint();
    const payerFlipTokenAccount = await spl.getAssociatedTokenAddress(
      flipMint.address,
      payerPubkey
    );
    const payerFlipTokenAccountInfo: anchor.web3.AccountInfo<Buffer> | null =
      await window.xnft.solana.connection
        .getAccountInfo(payerFlipTokenAccount)
        .catch((err: any) => {
          return null;
        });

    const ixns = [];
    if (payerFlipTokenAccountInfo === null) {
      const createTokenAccountIxn = spl.createAssociatedTokenAccountInstruction(
        payerPubkey,
        payerFlipTokenAccount,
        payerPubkey,
        flipMint.address
      );
      ixns.unshift(createTokenAccountIxn);
    }

    return { ixns, signers: [] };
  }

  async airdrop(
    payerPubkey = window.xnft.solana.publicKey,
    mint: PublicKey,
  ): Promise<string> {
    const req = await this.airdropReq(payerPubkey, new PublicKey(mint));

    const signature = await this.program.provider.sendAndConfirm!(
      new Transaction().add(...req.ixns),
      req.signers
    );

    return signature;
  }

  watch(
    betPlaced: (event: UserBetPlaced) => Promise<void> | void,
    betSettled: (event: UserBetSettled) => Promise<void> | void
  ) {
    this._programEventListeners.push(
      this.program.addEventListener(
        "UserBetPlaced",
        async (event: UserBetPlaced, slot: number, signature: string) => {
          if (!this.publicKey.equals(event.user)) {
            return;
          }
          const gameType = GameTypeValue.COIN_FLIP;
          await betPlaced({
            ...event,
            gameType: convertGameType(event.gameType),
          });
        }
      )
    );

    this._programEventListeners.push(
      this.program.addEventListener(
        "UserBetSettled",
        async (event: UserBetSettled, slot: number, signature: string) => {
          if (!this.publicKey.equals(event.user)) {
            return;
          }
          await betSettled({
            ...event,
            gameType: convertGameType(event.gameType),
          });
        }
      )
    );
  }

  async unwatch() {
    while (this._programEventListeners.length) {
      const id = this._programEventListeners.pop();
      if (Number.isFinite(id)) await this.program.removeEventListener(id as number);
    }
  }
}
