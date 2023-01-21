import '../components/bufferFill'
import React from "react";
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui'
import { Text, View } from "react-native";
import { Swap, usePublicKey, useStrataSdks } from "strata-foundation-react-xnft";
import { useWallet } from 'wallet-adapter-react-xnft';
 
import { Screen } from "../components/Screen";

export function SwapBoourns() {
  const { tokenBondingSdk } = useStrataSdks() 
  const { connected } = useWallet()
  const id = usePublicKey("8zLwiU8Tv7J2gnazEwChQLDgBLJG3cvJiHeHBhJfSZah")
  return (
    <Screen>
            { connected && tokenBondingSdk ? 
            (

      <View>
             <Swap id={id} />
            </View>
            ) : (

      <View>
      <WalletMultiButton />
     </View>
            )
            }
    </Screen>
  );
}
