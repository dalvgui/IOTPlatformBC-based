#!/bin/bash
#
#
# Exit on first error
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
CC_SRC_LANGUAGE=${1:-"go"}
CC_SRC_LANGUAGE=`echo "$CC_SRC_LANGUAGE" | tr [:upper:] [:lower:]`

if [ "$CC_SRC_LANGUAGE" = "go" -o "$CC_SRC_LANGUAGE" = "golang" ] ; then
	echo The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script
elif [ "$CC_SRC_LANGUAGE" = "javascript" ]; then
	CC_SRC_PATH="../chaincode/devicecontract/"
elif [ "$CC_SRC_LANGUAGE" = "java" ]; then
	echo The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script
elif [ "$CC_SRC_LANGUAGE" = "typescript" ]; then
	echo The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script
else
	echo The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script
	echo Supported chaincode language is: javascript
	exit 1
fi

# clean out any old identites in the wallets
rm -rf app/wallet/*

# launch network; create channel and join peer to channel
pushd ../test-network
./network.sh down
./network.sh up createChannel -ca -s couchdb
./network.sh deployCC -ccn devicecontract -ccv 1 -ccl ${CC_SRC_LANGUAGE} -ccp ${CC_SRC_PATH}
popd

