import { writable } from "svelte/store";

const store = () => {
  const { subscribe, set, update } = writable({
    darkMode: false,
    TezosProvider: undefined,
    userAddress: undefined,
    userBalance: undefined,
    userTips: 0,
    //contractAddress: "KT1Kkf3chaabWmEwb8U5NX66m6gbJtxqCoic",
    contractAddress: process.env.CONTRACT_ADDRESS,
    contractInstance: undefined,
    storage: undefined,
    favoriteList: null,
  });

  return {
    subscribe,
    setTezosProvider: (Tezos) => {
      update((currentStore) => ({ ...currentStore, TezosProvider: Tezos }));
    },
    updateUserAddress: (address) => {
      update((currentStore) => ({ ...currentStore, userAddress: address }));
    },
    updateUserBalance: (balance) => {
      update((currentStore) => ({ ...currentStore, userBalance: balance }));
    },
    updateUserTips: (tips) => {
      update((currentStore) => ({ ...currentStore, userTips: tips }));
    },
    updateContractInstance: (instance) => {
      update((currentStore) => ({
        ...currentStore,
        contractInstance: instance,
      }));
    },
    updateStorage: (storage) => {
      update((currentStore) => ({ ...currentStore, storage }));
    },
    updateFavoriteList: (list) => {
      update((currentStore) => ({ ...currentStore, favoriteList: list }));
    },
    toggleDarkMode: (currentStatus) => {
      // toggles html background color
      let bgColor, cardContentColor, cardContentFontColor;
      if (currentStatus === "on") {
        // turns off dark mode
        bgColor = "#f7fafc";
        cardContentColor = "transparent";
        cardContentFontColor = "#333";
      } else {
        // turns on darkmode
        bgColor = "#333";
        cardContentColor = "#333";
        cardContentFontColor = "white";
      }
      document.querySelector("html").style.backgroundColor = bgColor;

      document.querySelectorAll(".card-content").forEach((el) => {
        el.style.backgroundColor = cardContentColor;
        el.style.color = cardContentFontColor;
      });

      document
        .querySelectorAll(
          ".title, .subtitle, h1, h2, h3, h4, h5, .menu-custom-label"
        )
        .forEach((el) => (el.style.color = cardContentFontColor));

      document
        .querySelectorAll(".tip-image")
        .forEach((el) =>
          currentStatus === "on"
            ? (el.style.filter = "invert(0%)")
            : (el.style.filter = "invert(100%)")
        );

      document
        .querySelectorAll(".navbar-item")
        .forEach((el) => (el.style.color = cardContentFontColor));

      update((currentStore) => ({
        ...currentStore,
        darkMode: !currentStore.darkMode,
      }));
    },
    shortenAddress: (addr) =>
      addr.slice(0, 6) + "..." + addr.slice(addr.length - 6),
  };
};

export default store();
