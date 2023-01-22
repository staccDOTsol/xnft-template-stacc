import React, { useState } from "react";
import {  Text, TextInput, View } from "react-native";
import * as Linking from "expo-linking";
import * as sbv2 from "@switchboard-xyz/switchboard-v2";

import { Screen } from "../../src/components/Screen";

import Dice from 'react-dice-roll';
import chalk from "chalk";
export const CHECK_ICON = chalk.green("\u2714");
export const FAILED_ICON = chalk.red("\u2717");
import { User } from "../../client"
let PROGRAM_ID = new PublicKey("UUNnGwg9nNYci6hL1rwr15vobxWSncghgjCvMHp6EL9")
import * as anchor from '@coral-xyz/anchor'
import { Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

function LearnMoreLink({ url }: { url: string }) {
  return <Text style={{color:'darkblue', margin: "10%", fontSize:18}} onPress={() => Linking.openURL(url)}>Buy BONKers to Play!</Text>;
}

const IDL = {
  "version": "0.1.0",
  "name": "switchboard_vrf_flip",
  "instructions": [
    {
      "name": "houseInit",
      "accounts": [
        {
          "name": "house",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "switchboardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "switchboardQueue",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "houseVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "hydra",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "HouseInitParams"
          }
        }
      ]
    },
    {
      "name": "userInit",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "house",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rewardAddress",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vrf",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "UserInitParams"
          }
        }
      ]
    },
    {
      "name": "userBet",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "house",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "houseVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vrf",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "oracleQueue",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "CHECK"
          ]
        },
        {
          "name": "queueAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "dataBuffer",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "CHECK"
          ]
        },
        {
          "name": "permission",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "CHECK"
          ]
        },
        {
          "name": "vrfEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "switchboardProgramState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "switchboardProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vrfPayer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "flipPayer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recentBlockhashes",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "UserBetParams"
          }
        }
      ]
    },
    {
      "name": "userSettle",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "house",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardAddress",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "houseVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vrf",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "hydraAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "UserSettleParams"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "HouseState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "houseVault",
            "type": "publicKey"
          },
          {
            "name": "hydra",
            "type": "publicKey"
          },
          {
            "name": "switchboardQueue",
            "type": "publicKey"
          },
          {
            "name": "switchboardMint",
            "type": "publicKey"
          },
          {
            "name": "ebuf",
            "type": {
              "array": [
                "u8",
                1024
              ]
            }
          }
        ]
      }
    },
    {
      "name": "UserState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "house",
            "type": "publicKey"
          },
          {
            "name": "escrow",
            "type": "publicKey"
          },
          {
            "name": "rewardAddress",
            "type": "publicKey"
          },
          {
            "name": "vrf",
            "type": "publicKey"
          },
          {
            "name": "switchboardStateBump",
            "type": "u8"
          },
          {
            "name": "vrfPermissionBump",
            "type": "u8"
          },
          {
            "name": "currentRound",
            "type": {
              "defined": "Round"
            }
          },
          {
            "name": "lastAirdropRequestSlot",
            "type": "u64"
          },
          {
            "name": "ebuf",
            "type": {
              "array": [
                "u8",
                1024
              ]
            }
          },
          {
            "name": "history",
            "type": {
              "defined": "History"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "HouseInitParams",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "UserBetParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameType",
            "type": "u32"
          },
          {
            "name": "userGuess",
            "type": "u32"
          },
          {
            "name": "betAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "UserInitParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "switchboardStateBump",
            "type": "u8"
          },
          {
            "name": "vrfPermissionBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserSettleParams",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "GameConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "numVrfRequests",
            "type": "u8"
          },
          {
            "name": "min",
            "type": "u32"
          },
          {
            "name": "max",
            "type": "u32"
          },
          {
            "name": "payoutMultiplier",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "Round",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u128"
          },
          {
            "name": "status",
            "type": {
              "defined": "RoundStatus"
            }
          },
          {
            "name": "betAmount",
            "type": "u64"
          },
          {
            "name": "gameType",
            "type": {
              "defined": "GameType"
            }
          },
          {
            "name": "gameConfig",
            "type": {
              "defined": "GameConfig"
            }
          },
          {
            "name": "guess",
            "type": "u32"
          },
          {
            "name": "result",
            "type": "u32"
          },
          {
            "name": "requestSlot",
            "type": "u64"
          },
          {
            "name": "requestTimestamp",
            "type": "i64"
          },
          {
            "name": "settleSlot",
            "type": "u64"
          },
          {
            "name": "settleTimestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "History",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "idx",
            "type": "u32"
          },
          {
            "name": "max",
            "type": "u32"
          },
          {
            "name": "rounds",
            "type": {
              "array": [
                {
                  "defined": "Round"
                },
                48
              ]
            }
          }
        ]
      }
    },
    {
      "name": "GameType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "None"
          },
          {
            "name": "CoinFlip"
          },
          {
            "name": "SixSidedDiceRoll"
          },
          {
            "name": "TwentySidedDiceRoll"
          }
        ]
      }
    },
    {
      "name": "RoundStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "None"
          },
          {
            "name": "Awaiting"
          },
          {
            "name": "Settled"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "UserBetPlaced",
      "fields": [
        {
          "name": "roundId",
          "type": "u128",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "gameType",
          "type": {
            "defined": "GameType"
          },
          "index": false
        },
        {
          "name": "betAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "guess",
          "type": "u32",
          "index": false
        },
        {
          "name": "slot",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "UserBetSettled",
      "fields": [
        {
          "name": "roundId",
          "type": "u128",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "userWon",
          "type": "bool",
          "index": false
        },
        {
          "name": "gameType",
          "type": {
            "defined": "GameType"
          },
          "index": false
        },
        {
          "name": "betAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "escrowChange",
          "type": "u64",
          "index": false
        },
        {
          "name": "guess",
          "type": "u32",
          "index": false
        },
        {
          "name": "result",
          "type": "u32",
          "index": false
        },
        {
          "name": "slot",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidInitialVrfCounter",
      "msg": "VRF Account counter should be 0 for a new lottery"
    },
    {
      "code": 6001,
      "name": "InvalidVrfAuthority",
      "msg": "VRF Account authority should be the lottery Pubkey"
    },
    {
      "code": 6002,
      "name": "InvalidSwitchboardAccount",
      "msg": "Provided account is not owned by the switchboard program"
    },
    {
      "code": 6003,
      "name": "IncorrectVrfCounter",
      "msg": "VRF counter does not match the expected round id"
    },
    {
      "code": 6004,
      "name": "InvalidGameType",
      "msg": "Failed to match the game type"
    },
    {
      "code": 6005,
      "name": "CurrentRoundStillActive",
      "msg": "Current round is still active"
    },
    {
      "code": 6006,
      "name": "CurrentRoundAlreadyClosed",
      "msg": "Current round has already settled"
    },
    {
      "code": 6007,
      "name": "InvalidBet",
      "msg": "Invalid bet"
    },
    {
      "code": 6008,
      "name": "OracleQueueRequiresPermissions",
      "msg": "Switchboard queue requires VRF permissions to request randomness"
    },
    {
      "code": 6009,
      "name": "OracleQueueMismatch",
      "msg": "VRF account belongs to the incorrect oracle queue"
    },
    {
      "code": 6010,
      "name": "AirdropRequestedTooSoon",
      "msg": "User requested an airdrop too soon"
    },
    {
      "code": 6011,
      "name": "UserTokenBalanceHealthy",
      "msg": "User has enough funds and does not require an airdrop"
    },
    {
      "code": 6012,
      "name": "MaxBetAmountExceeded",
      "msg": "Max bet exceeded"
    },
    {
      "code": 6013,
      "name": "InsufficientFunds",
      "msg": "Insufficient funds to request randomness"
    },
    {
      "code": 6014,
      "name": "FlipRequestedTooSoon",
      "msg": "User can flip once every 10 seconds"
    }
  ],
  "metadata": {
    "address": "UUNnGwg9nNYci6hL1rwr15vobxWSncghgjCvMHp6EL9"
  }
}
export function HomeScreen() {
   
  const mint1 = new PublicKey("4Vyh36V9dYQdqUtxWc2nEzvezLjKn5qW5rPWACo8wddF")
  const mint2 = new PublicKey("8zLwiU8Tv7J2gnazEwChQLDgBLJG3cvJiHeHBhJfSZah")
  const [old, setOld] = useState("0")
  const [me1, setMe1] = useState<User>()
  const [me2, setMe2] = useState<User>()
  const [one, setOne] = useState(6)
  const [bet, setBet] = useState(666)
  const [bet2, setBet2] = useState(666)
  const [two, setTwo] = useState(6)
  const [bal1col, setBal1col] = useState("black")
  const [bal1, setBal1] = useState("")
  const [first, setFirst] = useState(true)
  setInterval(async function(){    setTimeout(async function(){
    const { flipProgram, switchboardProgram, payer, provider } =
    await loadCli(window.xnft.solana.connection);
    
        let oldbal = bal1 
  
   
  let user1: User;
  let user2: User;

  try {
    console.log(111)
  // @ts-ignore
    user2 = await User.getOrCreate(flipProgram, payer.publicKey, switchboardProgram, mint2);
  console.log(
    `${chalk.blue("Info")}: VRF Flip User account (${chalk.yellow(
      user2.publicKey.toBase58()
    )}) already exists for authority (${chalk.yellow(
      payer.publicKey.toBase58()
    )})`
  );
  } catch (error: any) {
  if (!error.toString().includes("User account does not exist")) {
    throw error;
  }
  // @ts-ignore
  user2 = await User.create(flipProgram, switchboardProgram, mint2);
  
  console.log(`${CHECK_ICON} User account created successfully`);
  }
  
  console.log(
  JSON.stringify(
    {
      ...user2.toJSON(),
      history: undefined,
      ebuf: undefined,
    },
    undefined,
    2
  )
  );
  try {
    console.log(111)
    // @ts-ignore
  user1 = await User.getOrCreate(flipProgram, payer.publicKey, switchboardProgram, mint1);
  console.log(
    `${chalk.blue("Info")}: VRF Flip User account (${chalk.yellow(
      user1.publicKey.toBase58()
    )}) already exists for authority (${chalk.yellow(
      payer.publicKey.toBase58()
    )})`
  );
  } catch (error: any) {
  if (!error.toString().includes("User account does not exist")) {
    throw error;
  }
  // @ts-ignore
  user1 = await User.create(flipProgram, switchboardProgram, mint1);
  
  console.log(`${CHECK_ICON} User account created successfully`);
  }
  
  console.log(
  JSON.stringify(
    {
      ...user1.toJSON(),
      history: undefined,
      ebuf: undefined,
    },
    undefined,
    2
  )
  );
  if (user1.toJSON().currentRound.status.kind.toString() == "Settled"){
    setOld(user1.toJSON().currentRound.result.toString() + ' && ' + user2.toJSON().currentRound.result.toString())
    console.log('argh')
  }
  let balls = ('bonkers'  + user1.toJSON().currentRound.status.kind + ': ' + user1.toJSON().currentRound.guess.toString() == user1.toJSON().currentRound.result.toString() ? 'WON!' : 'LOST :(')
  balls+=('boourns '  + user2.toJSON().currentRound.status.kind + ': ' + user2.toJSON().currentRound.guess.toString() == user2.toJSON().currentRound.result.toString() ? 'WON!' : 'LOST :(')

  setBal1(balls) 
  setMe1(user1) 
  setMe2(user2) 
 
      })    }, 20000)

  async function rollin1(value: number){
   
    const { flipProgram, switchboardProgram, payer, provider } =
await loadCli(window.xnft.solana.connection);

   
let user1: User;
let user2: User;

try {
  console.log(111)
// @ts-ignore
  user2 = await User.getOrCreate(flipProgram, payer.publicKey, switchboardProgram, mint2);
console.log(
  `${chalk.blue("Info")}: VRF Flip User account (${chalk.yellow(
    user2.publicKey.toBase58()
  )}) already exists for authority (${chalk.yellow(
    payer.publicKey.toBase58()
  )})`
);
} catch (error: any) {
if (!error.toString().includes("User account does not exist")) {
  throw error;
}
// @ts-ignore
user2 = await User.create(flipProgram, switchboardProgram, mint2);

console.log(`${CHECK_ICON} User account created successfully`);
}

console.log(
JSON.stringify(
  {
    ...user2.toJSON(),
    history: undefined,
    ebuf: undefined,
  },
  undefined,
  2
)
);
try {
  console.log(111)
  // @ts-ignore
user1 = await User.getOrCreate(flipProgram, payer.publicKey, switchboardProgram, mint1);
console.log(
  `${chalk.blue("Info")}: VRF Flip User account (${chalk.yellow(
    user1.publicKey.toBase58()
  )}) already exists for authority (${chalk.yellow(
    payer.publicKey.toBase58()
  )})`
);
} catch (error: any) {
if (!error.toString().includes("User account does not exist")) {
  throw error;
}
// @ts-ignore
user1 = await User.create(flipProgram, switchboardProgram, mint1);

console.log(`${CHECK_ICON} User account created successfully`);
}

console.log(
JSON.stringify(
  {
    ...user1.toJSON(),
    history: undefined,
    ebuf: undefined,
  },
  undefined,
  2
)
);
if (user1.toJSON().currentRound.status.kind.toString() == "Settled"){
  setOld(user1.toJSON().currentRound.result.toString() + ' && ' + user2.toJSON().currentRound.result.toString())
  console.log('argh')
}
let balls = ('bonkers'  + user1.toJSON().currentRound.status.kind + ': ' + user1.toJSON().currentRound.guess.toString() == user1.toJSON().currentRound.result.toString() ? 'WON!' : 'LOST :(')
balls+=('boourns '  + user2.toJSON().currentRound.status.kind + ': ' + user2.toJSON().currentRound.guess.toString() == user2.toJSON().currentRound.result.toString() ? 'WON!' : 'LOST :(')

setBal1(balls) 
setMe1(user1) 
setMe2(user2) 

setOne(value)
    if (first){
      setFirst(false)
    }
    else {

    }
    
  let aha = await user1.placeBetAndAwaitFlip(
      2,
     value,
      new anchor.BN(bet)  )
      if (typeof aha == String.prototype){
        // @ts-ignore
        setBal1(aha as string)
        setBal1col('red')
            }
    
  }


  async function loadCli(
    rpcUrl: string,
  ): Promise<{
    flipProgram:  anchor.Program;
    switchboardProgram: anchor.Program;
    payer: anchor.web3.Keypair;
    provider: anchor.AnchorProvider;
  }> {
    
  
    const url = rpcUrl 
    // const envProvider = anchor.AnchorProvider.local(url);
    const provider = window.xnft.solana
    const payer = window.xnft.solana

    const switchboardProgram = await sbv2.loadSwitchboardProgram(
      "mainnet-beta" ,
      provider.connection,
      payer,
      {
        commitment: "confirmed",
      }
    );
  
    // load VRF Client program
    // @TODO load IDL asynchronously?
    const flipProgram = new anchor.Program(
      IDL as Idl,
      PROGRAM_ID,
      provider,
      new anchor.BorshCoder(IDL as Idl)
    );
  
    return {
      flipProgram: flipProgram as any as  anchor.Program,
      switchboardProgram: switchboardProgram as any,
      payer,
      provider,
    };
  }
  async function rollin2(value: number){
    const { flipProgram, switchboardProgram, payer, provider } =
await loadCli(window.xnft.solana.connection);


   
let user1: User;
let user2: User;

try {
  console.log(111)
  user2 = await User.getOrCreate(flipProgram, payer.publicKey, switchboardProgram);
console.log(
  `${chalk.blue("Info")}: VRF Flip User account (${chalk.yellow(
    user2.publicKey.toBase58()
  )}) already exists for authority (${chalk.yellow(
    payer.publicKey.toBase58()
  )})`
);
} catch (error: any) {
if (!error.toString().includes("User account does not exist")) {
  throw error;
}
// @ts-ignore
user2 = await User.create(flipProgram, switchboardProgram, mint2);

console.log(`${CHECK_ICON} User account created successfully`);
}

console.log(
JSON.stringify(
  {
    ...user2.toJSON(),
    history: undefined,
    ebuf: undefined,
  },
  undefined,
  2
)
);
try {
  console.log(111)
  // @ts-ignore
user1 = await User.getOrCreate(flipProgram, payer.publicKey, switchboardProgram, mint1);
console.log(
  `${chalk.blue("Info")}: VRF Flip User account (${chalk.yellow(
    user1.publicKey.toBase58()
  )}) already exists for authority (${chalk.yellow(
    payer.publicKey.toBase58()
  )})`
);
} catch (error: any) {
if (!error.toString().includes("User account does not exist")) {
  throw error;
}
// @ts-ignore
user1 = await User.create(flipProgram, switchboardProgram, mint1);

console.log(`${CHECK_ICON} User account created successfully`);
}

console.log(
JSON.stringify(
  {
    ...user1.toJSON(),
    history: undefined,
    ebuf: undefined,
  },
  undefined,
  2
)
);
if (user1.toJSON().currentRound.status.kind.toString() == "Settled"){
  setOld(user1.toJSON().currentRound.result.toString() + ' && ' + user2.toJSON().currentRound.result.toString())
  console.log('argh')
}
let balls = ('bonkers'  + user1.toJSON().currentRound.status.kind + ': ' + user1.toJSON().currentRound.guess.toString() == user1.toJSON().currentRound.result.toString() ? 'WON!' : 'LOST :(')
balls+=('boourns '  + user2.toJSON().currentRound.status.kind + ': ' + user2.toJSON().currentRound.guess.toString() == user2.toJSON().currentRound.result.toString() ? 'WON!' : 'LOST :(')

setBal1(balls) 
setMe1(user1) 
setMe2(user2) 

    setTwo(value)
    if (first){
      setFirst(false)
    }
    else {

    }
    let aha = await user2.placeBetAndAwaitFlip(
        2,
       value,
        new anchor.BN(bet2)  )
        if (typeof aha == String.prototype){
          // @ts-ignore
          setBal1(aha as string)
          setBal1col('red')
              }
      
  }

  return (
    <Screen >
      <Text  style={{color:'red', margin: "10%", fontSize:18}}>Hello World, from Stacc - :) </Text>
      <Text style={{margin:15, color:bal1col}}  >Your wager?</Text>
     <TextInput value={(bet / 10 ** 2).toString() } onChange={(v: any) => setBet(Math.floor(v.target.value) * 10 ** 2)} ></TextInput>
     <TextInput value={(bet2 / 10 ** 2).toString() } onChange={(v: any) => setBet2(Math.floor(v.target.value) * 10 ** 2)} ></TextInput>
     
     <Text style={{margin:15, color:bal1col}}  >{bal1}</Text>
      <Text style={{margin:15, color:bal1col}}  >You:</Text>

      <Dice triggers={['Enter', 'a', 'click']} placement={'bottom-right'} size={100} defaultValue={6} 
      rollingTime={Math.random() * 1999 + 5000} onRoll={rollin1}/>
            <Dice triggers={['Enter', 'a', 'click']} placement={'bottom-right'} size={100} defaultValue={6} 
      rollingTime={Math.random() * 1999 + 5000} onRoll={rollin2}/>
      <Text style={{margin:15, color:bal1col}}  >House:</Text>
       {
        <div>
      me1  &&       <Text style={{fontSize:36, margin:15, color:bal1col}}  >{ me1 ? me1.toJSON().currentRound.result.toString() as string:null}</Text>
      </div>
} 
   {
        <div>
      me2  &&       <Text style={{fontSize:36, margin:15, color:bal1col}}  >{ me2 ? me2.toJSON().currentRound.result.toString() as string:null}</Text>
      </div>
}
    </Screen>
  );
}
