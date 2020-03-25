import { writable } from "svelte/store";

const store = () => {
  const { subscribe, set, update } = writable({
    //userAddress: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
    //userBalance: 20,
    userAddress: undefined,
    userBalance: undefined,
    contractAddress: "KT1MzLqhd1aQhkAr9Y6RzWVu7p3gkyp5vysC",
    storage: {}
  });

  return {
    subscribe,
    updateUserAddress: address => {
      update(currentStore => ({ ...currentStore, userAddress: address }));
    },
    updateUserBalance: balance => {
      update(currentStore => ({ ...currentStore, userBalance: balance }));
    },
    setStorage: storage => {
      update(currentStore => ({ ...currentStore, storage }));
    }
  };
};

export default store();
