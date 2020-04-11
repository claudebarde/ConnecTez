<script>
  import { afterUpdate } from "svelte";
  import { fade } from "svelte/transition";
  import moment from "moment";
  import { push } from "svelte-spa-router";
  import store from "../store/store.js";
  import Avatar from "../components/Avatar.svelte";
  import Rating from "../components/Rating.svelte";

  export let params;
  let address, profile, error;
  let generalInfo = {};
  let loading = true;
  let addingToFavorite = false;

  const getPostInfo = async posts =>
    Promise.all(
      posts.map(async hash => {
        const post = await $store.storage.all_posts.get(hash);
        if (post.author === $store.userAddress) {
          return Promise.resolve({
            ipfsHash: hash,
            timestamp: post.timestamp
          });
        } else {
          return Promise.reject("Addresses do not match");
        }
      })
    );

  const addToFavorite = () => {
    if (window.localStorage) {
      addingToFavorite = true;
      let newList;
      if ($store.favoriteList) {
        newList = [...$store.favoriteList, address];
        window.localStorage.setItem("favoriteList", JSON.stringify(newList));
      } else {
        newList = [address];
        window.localStorage.setItem("favoriteList", JSON.stringify(newList));
      }
      addingToFavorite = false;
      store.updateFavoriteList([...newList]);
    }
  };

  const removeFromFavorite = () => {
    if (window.localStorage) {
      addingToFavorite = true;
      if ($store.favoriteList) {
        let newList = $store.favoriteList.filter(el => el !== address);
        window.localStorage.setItem("favoriteList", JSON.stringify(newList));
        store.updateFavoriteList([...newList]);
      }
      addingToFavorite = false;
    }
  };

  afterUpdate(async () => {
    if (loading && params.address) {
      address = params.address;
      if ($store.storage) {
        try {
          const info = await $store.storage.bloggers.get(address);
          generalInfo = { ...info };
          // adds info to IPFS hashes
          profile = {
            ...info,
            posts_set: await getPostInfo(info.posts_set)
          };
          loading = false;
          error = false;
        } catch (error) {
          console.log(error);
          error = true;
          loading = false;
        }
      }
    }
  });
</script>

<style>
  main {
    padding-top: 80px;
  }

  .profile-container {
    height: 100%;
    width: 60%;
    margin: 0 auto;
    background-color: #ffffff;
  }

  .loading-ipfs {
    -webkit-animation: loading-ipfs 3s infinite; /* Safari 4+ */
    -moz-animation: loading-ipfs 3s infinite; /* Fx 5+ */
    -o-animation: loading-ipfs 3s infinite; /* Opera 12+ */
    animation: loading-ipfs 3s infinite; /* IE 10+, Fx 29+ */
    width: 90px;
  }

  @keyframes loading-ipfs {
    0% {
      transform: rotate(0deg);
      margin-left: 0%;
    }
    100% {
      transform: rotate(360deg);
      margin-left: 90%;
    }
  }

  @media only screen and (max-width: 1023px) {
    main {
      padding-top: 20px;
    }

    .profile-container {
      width: 90%;
    }
  }
</style>

<main>
  <div class="card profile-container">
    <div class="card-content">
      {#if loading}
        <img src="ipfs-logo.png" alt="loading" class="loading-ipfs" />
      {:else if profile}
        <div>
          <div class="media">
            <div class="media-content">
              <h1 class="title is-size-4">Blogger's profile</h1>
            </div>
            <div class="media-right">
              <Avatar seed={address} />
            </div>
          </div>
          {#if profile.name}
            <div class="columns is-mobile">
              <div class="column is-two-fifth">Name</div>
              <div class="column is-three-fifths">{profile.name}</div>
            </div>
          {/if}
          <div class="columns is-mobile">
            <div class="column is-two-fifth">Address</div>
            <div class="column is-three-fifths" style="word-break:break-word">
              {address}
            </div>
          </div>
          <div class="columns is-mobile">
            <div class="column is-two-fifth">Rating</div>
            <div class="column is-three-fifths">
              {#if profile.total_tips.toNumber() > 0}
                <Rating tips={profile.total_tips.toNumber()} />
              {:else}No rating yet{/if}
            </div>
          </div>
          {#if window.localStorage}
            <div class="columns is-mobile">
              <div class="column is-two-fifth">Actions</div>
              <div class="column is-three-fifths">
                {#if $store.favoriteList && $store.favoriteList.includes(address)}
                  <button
                    class="button is-info is-light is-small"
                    on:click={removeFromFavorite}
                    class:is-loading={addingToFavorite}>
                    Remove from favorite
                  </button>
                {:else}
                  <button
                    class="button is-info is-light is-small"
                    on:click={addToFavorite}
                    class:is-loading={addingToFavorite}>
                    Add to favorite
                  </button>
                {/if}
              </div>
            </div>
          {/if}
          <div class="columns">
            <div class="column is-two-fifth">Blog posts</div>
            <div class="column is-three-fifths">
              {#if profile.posts_set.length === 0}
                <div in:fade={{ delay: 400 }}>No post yet</div>
              {:else}
                {#each profile.posts_set as post}
                  <div class="columns is-mobile">
                    <div class="column is-two-fifths">
                      <a href={`/#/post/${post.ipfsHash}`}>
                        {post.ipfsHash.slice(0, 10)}...
                      </a>
                    </div>
                    <div class="column is-three-fifths">
                      <span class="is-size-7">
                        {moment(Date.parse(post.timestamp)).format('MMM Do Y')}
                      </span>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>
      {:else}No profile{/if}
    </div>
  </div>
</main>
