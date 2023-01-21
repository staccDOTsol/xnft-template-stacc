import React, { FC } from "react";


import { StrataProviders } from "strata-foundation-react-xnft";
import { Wallet } from "./Wallet";

type Props = {
    children: JSX.Element | JSX.Element[] | null;
  };
  
  export function Providers({ children }: Props) {
    return(
        <Wallet>
            <StrataProviders>{children}</StrataProviders>
        </Wallet>
    )
  }