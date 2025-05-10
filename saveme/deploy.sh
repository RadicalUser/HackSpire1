#!/usr/bin/env bash
set -euo pipefail

# Figure out the directory this script lives in, then cd into its sibling `contract/`
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/contract"

# Deploy each module via npx (avoids the bunx/Node loader bug)
npx hardhat ignition deploy ignition/modules/TokenFactoryModule.js       --network localhost
npx hardhat ignition deploy ignition/modules/LiquidityPoolAutomation.js  --network localhost
npx hardhat ignition deploy ignition/modules/AnomalyGuard.js             --network localhost
npx hardhat ignition deploy ignition/modules/Transfer.js                 --network localhost
npx hardhat ignition deploy ignition/modules/Wallet.js                   --network localhost
npx hardhat ignition deploy ignition/modules/TokenFactoryLPModule.js     --network localhost


echo "✅ All modules deployed."