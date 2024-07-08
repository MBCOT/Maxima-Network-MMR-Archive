# Server Dapp

## Functionality
Anyone running (MMR / ARCHIVE) nodes can install the server Dapp, making their node part of the network. Users with the client Dapp can then send petitions to any node in this network.
- **First Installation:** Registers the script network based on the node type, sending 0.0001 Minima to the script address with state variables such as:
  - Maxima publickey
  - Maxima address
  - Wallet publickey (for updating coin info)
- **Subsequent Updates:** The script coin info is modified with updated state variables every three minutes (or when the Maxima address changes, for testing purposes).
- Once the coin is published/updated, any client Dapp can view the coin and use it to send petitions to the network node for information, which is delivered over Maxima.

## Install
Zip the server content folder (only the content, excluding the folder itself). Install this zip dapp file into any Minima node, launch the dapp, and start searching blockchain info.

## Note
This is only a proof of concept and requires further work to become a finished dapp. The coin update on the script is done every three minutes for testing purposes but should be done whenever the Maxima address changes.
- ** Only works on MMR nodes ** This proof of concept so far it only works on Mega MMR nodes as it needs to be adapted the part that builds the commands to search for info on the Archives nodes to their specific syntax that is different from MMR nodes.
