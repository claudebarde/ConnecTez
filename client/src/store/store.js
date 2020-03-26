import { writable } from "svelte/store";

const store = () => {
  const { subscribe, set, update } = writable({
    //userAddress: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
    //userBalance: 20,
    userAddress: undefined,
    userBalance: undefined,
    contractAddress: "KT1KXoytiwQBPFF1nzix4qLqV46gwvrtsW2H",
    contractInstance: undefined,
    storage: undefined
  });

  return {
    subscribe,
    updateUserAddress: address => {
      update(currentStore => ({ ...currentStore, userAddress: address }));
    },
    updateUserBalance: balance => {
      update(currentStore => ({ ...currentStore, userBalance: balance }));
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
