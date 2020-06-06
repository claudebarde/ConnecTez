import { writable } from "svelte/store";
import config from "../config";

const store = () => {
  const { subscribe, set, update } = writable({
    DEV_ENV: config.DEV_ENV,
    darkMode: false,
    TezosProvider: undefined,
    walletProvider: undefined,
    beaconWallet: undefined,
    userAddress: undefined,
    userBalance: undefined,
    userTips: 0,
    contractAddress:
      config.DEV_ENV === "local"
        ? "KT1NBqnm6zVsPeV4Pu23AZ2BSbQyb75JcKYX"
        : config.DEV_ENV === "carthage"
        ? "KT1FvmwJTzzQx2ntMiQ4re3vSA9uFtgAAFiC"
        : "",
    contractInstance: undefined,
    storage: undefined,
    favoriteList: null,
    bloggerAccount: undefined,
    trendingTags: [],
  });

  return {
    subscribe,
    setTezosProvider: (Tezos) => {
      update((currentStore) => ({ ...currentStore, TezosProvider: Tezos }));
    },
    updateWalletProvider: (provider) => {
      update((currentStore) => ({ ...currentStore, walletProvider: provider }));
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
    updateBloggerAccount: (account) => {
      update((currentStore) => ({ ...currentStore, bloggerAccount: account }));
    },
    updateUserName: (userName) => {
      update((currentStore) => ({
        ...currentStore,
        bloggerAccount: { ...currentStore.bloggerAccount, name: userName },
      }));
    },
    updateTrendingTags: (tags) => {
      update((currentStore) => ({ ...currentStore, trendingTags: tags }));
    },
    updateBeaconWallet: (wallet) => {
      update((currentStore) => ({ ...currentStore, beaconWallet: wallet }));
    },
    toggleDarkMode: (status) => {
      const dark = "#2d3748";
      const lessDark = "#4a5568";
      // toggles html background color
      let bgColor, cardContentColor, cardContentFontColor;
      if (status === "off") {
        // turns off dark mode
        bgColor = "#f7fafc";
        cardContentColor = "transparent";
        cardContentFontColor = "#333";
      } else {
        // turns on darkmode
        bgColor = dark;
        cardContentColor = lessDark;
        cardContentFontColor = "white";
      }

      document.querySelector("html").style.backgroundColor = bgColor;

      document.querySelectorAll(".card-content").forEach((el) => {
        el.style.backgroundColor = cardContentColor;
        el.style.color = cardContentFontColor;
      });

      if (document.getElementById("post-content")) {
        document
          .getElementById("post-content")
          .querySelectorAll(
            ".title, .subtitle, h1, h2, h3, h4, h5, .menu-custom-label, strong, em"
          )
          .forEach((el) => (el.style.color = cardContentFontColor));
      }

      document
        .querySelectorAll(".tip-image")
        .forEach((el) =>
          status === "off"
            ? (el.style.filter = "invert(0%)")
            : (el.style.filter = "invert(100%)")
        );

      document
        .querySelectorAll(".navbar-item")
        .forEach((el) => (el.style.color = cardContentFontColor));

      update((currentStore) => ({
        ...currentStore,
        darkMode: status === "on" ? true : false,
      }));
    },
    shortenAddress: (addr) =>
      addr.slice(0, 6) + "..." + addr.slice(addr.length - 6),
    chunkPostsList: (array, chunk_size) =>
      Array(Math.ceil(array.length / chunk_size))
        .fill()
        .map((_, index) => index * chunk_size)
        .map((begin) => array.slice(begin, begin + chunk_size)),
  };
};

export default store();
