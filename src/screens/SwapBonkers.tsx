import '../components/bufferFill'
import React from "react";
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui'
import { Text, View } from "react-native";
import { Swap, usePublicKey, useStrataSdks } from "strata-foundation-react-xnft";
import { useWallet } from 'wallet-adapter-react-xnft';
 
import { Screen } from "../components/Screen";

export function SwapBonkers() {
  const { tokenBondingSdk } = useStrataSdks() 
  const { connected } = useWallet()
  const id = usePublicKey("4Vyh36V9dYQdqUtxWc2nEzvezLjKn5qW5rPWACo8wddF")
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
