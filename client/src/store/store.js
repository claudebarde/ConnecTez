import { writable } from "svelte/store";

const store = () => {
  const { subscribe, set, update } = writable({
    //userAddress: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
    //userBalance: 20,
    TezosProvider: undefined,
    userAddress: undefined,
    userBalance: undefined,
    contractAddress: "KT1NxhbzemjGpcvLWuHa4XYagEZ3sDdqW83r",
    contractInstance: undefined,
    storage: undefined
  });

  return {
    subscribe,
    setTezosProvider: Tezos => {
      update(currentStore => ({ ...currentStore, TezosProvider: Tezos }));
    },
    updateUserAddress: address => {
      update(currentStore => ({ ...currentStore, userAddress: address }));
    },
    updateUserBalance: balance => {
      update(currentStore => ({ ...currentStore, userBalance: balance }));
    },
    updateUserTips: tips => {
      update(currentStore => ({ ...currentStore, userTips: tips }));
    },
    updateContractInstance: instance => {
      update(currentStore => ({ ...currentStore, contractInstance: instance }));
    },
    updateStorage: storage => {
      update(currentStore => ({ ...currentStore, storage }));
    },
    shortenAddress: addr =>
      addr.slice(0, 6) + "..." + addr.slice(addr.length - 6)
  };
};

export default store();
