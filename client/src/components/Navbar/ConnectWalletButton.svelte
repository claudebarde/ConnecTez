<script>
  import store from "../../store/store";
  import { TezBridgeSigner } from "@taquito/tezbridge-signer";
  import { BeaconWallet } from "@taquito/beacon-wallet";
  import config from "../../config";

  const initTezBridgeWallet = async () => {
    try {
      // gets user's address
      const address = await window.tezbridge.request({ method: "get_source" });
      store.updateUserAddress(address);
      // updates Tezos Provider
      $store.TezosProvider.setSignerProvider(new TezBridgeSigner());
      // gets user's balance
      const balance = await $store.TezosProvider.tz.getBalance(address);
      store.updateUserBalance(balance);
      // saves the address in local storage for autoconnection on the next visit
      if (window.localStorage) {
        window.localStorage.setItem("previousAddress", address);
      }
      // updates store
      store.updateWalletProvider("tezbridge");
      if (config.DEV_ENV === "local") {
        // sending money to Beacon address for testing purposes
        await $store.TezosProvider.contract.transfer({
          to: "tz1a53c5dfKMRGjk7SZs7n7M3oPpj1VPnXzD",
          amount: 10000
        });
      }
    } catch (error) {
      console.log("error fetching the address or balance:", error);
    }
  };

  const initBeaconWallet = async () => {
    // will avoid Tezbridge to open next time if user chooses Beacon
    window.localStorage.removeItem("previousAddress");
    // initialize beacon wallet
    try {
      const wallet = new BeaconWallet({ name: "ConnecTez" });
      const network = {
        type: "custom",
        name: "Sandoxed_Network",
        rpcUrl: "http://localhost:8732/"
      };
      $store.TezosProvider.setWalletProvider(wallet);

      const response = await wallet.requestPermissions({ network });
      if (wallet.permissions.address) {
        // saves user's address
        store.updateUserAddress(wallet.permissions.address);
        // gets user's balance
        const balance = await $store.TezosProvider.tz.getBalance(
          wallet.permissions.address
        );
        store.updateUserBalance(balance);
        // updates store
        store.updateWalletProvider("beacon");
        store.updateBeaconWallet(wallet);
      } else {
        throw "No address";
      }
    } catch (err) {
      console.log(err);
    }
  };
</script>

<style>
  .wallet-icon {
    height: 20px;
    width: 20px;
    vertical-align: middle;
    margin-right: 20px;
  }
</style>

<div class="dropdown is-hoverable is-right">
  <div class="dropdown-trigger">
    <button
      aria-haspopup="true"
      aria-controls="dropdown-connect-wallet"
      class="button is-info is-light"
      class:is-light={!$store.darkMode}>
      Connect wallet
    </button>
  </div>
  <div class="dropdown-menu" id="dropdown-connect-wallet" role="menu">
    <div class="dropdown-content">
      <a
        href="#/"
        class="dropdown-item"
        on:click|preventDefault={initTezBridgeWallet}>
        <img src="tezbridge-icon.png" alt="tezbridge" class="wallet-icon" />
        <strong>TezBridge</strong>
      </a>
      <a
        href="#/"
        class="dropdown-item"
        on:click|preventDefault={initBeaconWallet}>
        <img src="beacon-icon.png" alt="beacon" class="wallet-icon" />
        <strong>Beacon</strong>
      </a>
    </div>
  </div>
</div>
