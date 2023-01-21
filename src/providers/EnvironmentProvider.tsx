import { Cluster, Connection } from '@solana/web3.js'
import { firstParam } from '../common/utils'
import React, { useContext, useMemo, useState } from 'react'

export interface Environment {
  label: Cluster
  primary: string
  secondary?: string
}

export interface EnvironmentContextValues {
  environment: Environment
  setEnvironment: (newEnvironment: Environment) => void
  connection: Connection
}

export const ENVIRONMENTS: Environment[] = [
  {
    label: 'mainnet-beta',
    primary:
      'https://solana-api.syndica.io/access-token/mRW51tUgvuCwoF3DuHCMSBMxQyE8wXkP7Y7CnIzB4j1C8p8gt6SBBct5Gf2ey3xc',
    secondary: 'https://ssc-dao.genesysgo.net',
  },
  {
    label: 'testnet',
    primary: 'https://api.testnet.solana.com',
  },
  {
    label: 'devnet',
    primary: 'https://api.devnet.solana.com',
  },
]

const EnvironmentContext: React.Context<null | EnvironmentContextValues> =
  React.createContext<null | EnvironmentContextValues>(null)

export const getInitialProps = async ({
  ctx,
}: {
  ctx: any
}): Promise<{ cluster: string }> => {
  const cluster = (ctx.req?.headers.host || ctx.query.host)?.includes('dev')
    ? 'devnet'
    : (ctx.query.project || ctx.query.host)?.includes('test')
    ? 'testnet'
    : ctx.query.cluster || process.env.BASE_CLUSTER
  return {
    cluster: firstParam(cluster),
  }
}

export function EnvironmentProvider({
  children,
  defaultCluster,
}: {
  children: React.ReactChild
  defaultCluster: string
}) {
  const cluster = 'mainnet-beta'
  const foundEnvironment = ENVIRONMENTS.find((e) => e.label === cluster)
  const [environment, setEnvironment] = useState<Environment>(
    foundEnvironment ?? ENVIRONMENTS[0]!
  )

  useMemo(() => {
    const foundEnvironment = ENVIRONMENTS.find((e) => e.label === cluster)
    setEnvironment(foundEnvironment ?? ENVIRONMENTS[0]!)
  }, [cluster])

  const connection = useMemo(
    () => new Connection(environment.primary, { commitment: 'confirmed' }),
    [environment]
  )

  return (
    <EnvironmentContext.Provider
      value={{
        environment,
        setEnvironment,
        connection,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironmentCtx(): EnvironmentContextValues {
  const context = useContext(EnvironmentContext)
  if (!context) {
    throw new Error('Missing connection context')
  }
  return context
}
