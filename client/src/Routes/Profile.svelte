<script>
  import { afterUpdate } from "svelte";
  import { fade, fly } from "svelte/transition";
  import moment from "moment";
  import store from "../store/store.js";

  let profile;
  let loading = true;
  let deletePostModal = false;
  let hashToDelete = undefined;
  let waitingForRemoval = undefined;
  let addNameInputOpen = false;
  let userName = "";
  let updatingUserName = false;

  const confirmDelete = async () => {
    if (hashToDelete) {
      waitingForRemoval = hashToDelete;
      deletePostModal = false;
      // unpins JSON content from Pinata
      const UNPINJSON =
        process.env.NODE_ENV === "development"
          ? "http://localhost:34567/unpinJSON"
          : "https://tezos-ipfs-blog.netlify.com/.netlify/functions/unpinJSON";
      const response = await fetch(UNPINJSON, {
        body: JSON.stringify({ hash: hashToDelete }),
        method: "POST"
      });
      // deletes data from smart contract
      if (response.status === 200) {
        try {
          const op = await $store.contractInstance.methods
            .delete(hashToDelete)
            .send();
          await op.confirmation(1);
          // updates profile
          profile = {
            ...profile,
            posts_set: profile.posts_set.filter(
              el => el.ipfsHash !== hashToDelete
            )
          };
          waitingForRemoval = undefined;
          hashToDelete = undefined;
        } catch (error) {
          console.log(error);
        }
      } else {
        console.error(response);
      }
    }
  };

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

  const updateName = async () => {
    if (userName) {
      updatingUserName = true;
      try {
        const op = await $store.contractInstance.methods
          .updateBlogger(userName)
          .send();
        await op.confirmation(1);
        profile = { ...profile, name: userName };
        updatingUserName = false;
        userName = "";
      } catch (error) {
        console.log(error);
      }
    }
  };

  afterUpdate(async () => {
    if ($store.storage && $store.userAddress && loading) {
      try {
        const info = await $store.storage.bloggers.get($store.userAddress);
        // adds info to IPFS hashes
        profile = {
          ...info,
          posts_set: await getPostInfo(info.posts_set)
        };
        loading = false;
      } catch (error) {
        console.log(error);
      }
    }
  });
</script>

<style>
  main {
    height: 100vh;
    background-color: #f7f8f9;
  }

  .profile-container {
    padding-top: 80px;
    height: 100vh;
    width: 50%;
    margin: 0 auto;
    background-color: #ffffff;
  }

  .profile {
    width: 100%;
  }

  .menu-icon {
    width: 16px;
    vertical-align: middle;
    cursor: pointer;
  }

  .confirm-buttons {
    margin: 20px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }

  .confirm-buttons button {
    margin-right: 10px;
  }

  @media only screen and (max-width: 1023px) {
    .profile-container {
      padding-top: 30px;
      width: 90%;
    }
  }
</style>

<!-- MODAL TO CONFIRM POST REMOVAL -->
{#if deletePostModal}
  <div class="modal is-active">
    <div
      class="modal-background"
      in:fade={{ duration: 200 }}
      out:fade={{ delay: 100, duration: 200 }} />
    <div
      class="modal-content"
      in:fly={{ y: -200, duration: 400, delay: 100 }}
      out:fly={{ y: -200, duration: 400, delay: 0 }}>
      <div class="box">
        <h2 class="subtitle">Confirm Post Removal?</h2>
        <p>Are you sure you want to delete this post?</p>
        <p>
          Please note that this will remove your post from Pinata IPFS node (and
          the front page), but not from the IPFS if the content is pinned or
          persisted on another node.
        </p>
        <div class="confirm-buttons">
          <button
            class="button is-danger is-light"
            on:click={() => (deletePostModal = false)}>
            Cancel
          </button>
          <button class="button is-success is-light" on:click={confirmDelete}>
            Confirm
          </button>
        </div>
      </div>
    </div>
    <button
      class="modal-close is-large"
      aria-label="close"
      on:click={() => (deletePostModal = false)} />
  </div>
{/if}
<main>
  <div class="card profile-container">
    <div class="card-content">
      <h1 class="title is-size-4">Profile</h1>
      {#if profile}
        <table class="table profile">
          <tbody>
            <tr>
              <td>Name</td>
              {#if profile.name !== null}
                <td>
                  <div class="columns">
                    <div class="column is-half">{profile.name}</div>
                    <div class="column is-half">
                      <button
                        class="button is-small is-light is-info"
                        on:click={() => {
                          profile = { ...profile, name: null };
                          addNameInputOpen = true;
                        }}>
                        Update
                      </button>
                    </div>
                  </div>
                </td>
              {:else}
                <td>
                  {#if addNameInputOpen}
                    <div class="field has-addons">
                      <div
                        class="control is-small"
                        style="width:50%"
                        class:is-loading={updatingUserName}>
                        <input
                          class="input is-small"
                          type="text"
                          placeholder="Choose your display name"
                          bind:value={userName}
                          disabled={userName.length >= 20 || updatingUserName} />
                      </div>
                      <div class="control">
                        {#if updatingUserName}
                          <button
                            class="button is-light is-info is-small"
                            disabled>
                            Please wait
                          </button>
                        {:else}
                          <button
                            class="button is-light is-info is-small"
                            on:click={updateName}>
                            Update
                          </button>
                        {/if}
                      </div>
                    </div>
                  {:else}
                    <button
                      class="button is-small is-light is-info"
                      on:click={() => (addNameInputOpen = true)}>
                      Add your name
                    </button>
                  {/if}
                </td>
              {/if}
            </tr>
            <tr>
              <td>Total Tips</td>
              <td>ꜩ {profile.total_tips.toNumber() / 1000000}</td>
            </tr>
            <tr>
              <td>Current tips</td>
              <td>ꜩ {$store.userTips / 1000000}</td>
            </tr>
            <tr>
              <td>Blog posts</td>
              <td>
                {#if profile.posts_set.length === 0}
                  <div in:fade={{ delay: 400 }}>No post yet</div>
                {:else}
                  {#each profile.posts_set as post}
                    <div
                      class="columns is-mobile"
                      out:fly={waitingForRemoval ? { x: 200, duration: 400 } : { x: 0, duration: 0 }}>
                      <div class="column is-two-fifths">
                        <a href={`/#/post/${post.ipfsHash}`}>
                          {post.ipfsHash.slice(0, 10)}...
                        </a>
                      </div>
                      <div class="column is-two-fifths">
                        <span class="is-size-7">
                          {moment(Date.parse(post.timestamp)).format('MMM Do Y')}
                        </span>
                      </div>
                      <div class="column is-one-fifth">
                        {#if waitingForRemoval === post.ipfsHash}
                          <button class="button is-danger is-loading is-small">
                            Loading
                          </button>
                        {:else}
                          <img
                            class="menu-icon"
                            src="menu-icons/trash.svg"
                            alt="delete"
                            on:click={() => {
                              hashToDelete = post.ipfsHash;
                              deletePostModal = true;
                            }} />
                        {/if}
                      </div>
                    </div>
                  {/each}
                {/if}
              </td>
            </tr>
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</main>
