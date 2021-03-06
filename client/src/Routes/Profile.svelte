<script>
  import { fade, fly, slide } from "svelte/transition";
  import moment from "moment";
  import { push } from "svelte-spa-router";
  import store from "../store/store.js";

  let profile;
  let deletePostModal = false;
  let hashToDelete = undefined;
  let waitingForRemoval = undefined;
  let addNameInputOpen = false;
  let userName = "";
  let updatingUserName = false;
  let noProfile = false;
  let displayFavoriteList = false;

  const confirmDelete = async () => {
    if (hashToDelete) {
      waitingForRemoval = hashToDelete;
      deletePostModal = false;
      // unpins JSON content from Pinata
      const UNPINJSON =
        process.env.NODE_ENV === "development"
          ? `http://localhost:${config.NETLIFY_PORT}/unpinJSON`
          : "https://tezos-ipfs-blog.netlify.com/.netlify/functions/unpinJSON";
      const response = await fetch(UNPINJSON, {
        body: JSON.stringify({ hash: hashToDelete }),
        method: "POST"
      });
      // deletes data from smart contract
      if (response.status === 200) {
        try {
          const op = await $store.contractInstance.methods
            .deletePost(hashToDelete)
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

  const formatUserName = event => {
    let user = event.target.value.replace(/ /g, "-");
    userName = user;
  };

  const updateName = async () => {
    if (userName) {
      updatingUserName = true;
      try {
        const op = await $store.contractInstance.methods
          .updateBlogger(userName)
          .send({
            amount: $store.storage.updateNameFee.toNumber(),
            mutez: true
          });
        await op.confirmation();
        profile = { ...profile, name: userName };
        store.updateUserName(userName);
      } catch (error) {
        console.log(error);
      } finally {
        addNameInputOpen = false;
        userName = "";
        updatingUserName = false;
      }
    }
  };
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
    main {
      padding-top: 20px;
    }

    .profile-container {
      width: 90%;
    }
  }
</style>

<svelte:head>
  <title>Profile - ConnecTez</title>
</svelte:head>
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
      <div class="columns is-vcentered">
        <div class="column is-half has-text-left">
          <h1 class="title is-size-4">Profile</h1>
        </div>
        <div class="column is-half has-text-right is-size-7">
          {#if $store.bloggerAccount}
            Contract version: {$store.bloggerAccount.version}
          {/if}
        </div>
      </div>
      {#if $store.bloggerAccount === undefined}
        <p>Loading your profile information from the blockchain...</p>
      {:else if $store.bloggerAccount}
        <div class="columns is-mobile">
          <div class="column is-two-fifth">Name</div>
          <div class="column is-three-fifths">
            {#if $store.bloggerAccount.name !== null && !addNameInputOpen}
              <div class="columns">
                <div class="column is-half">{$store.bloggerAccount.name}</div>
                <div class="column is-half">
                  <button
                    class="button is-small is-light is-info"
                    on:click={() => {
                      userName = $store.bloggerAccount.name;
                      addNameInputOpen = true;
                    }}>
                    Update
                  </button>
                </div>
              </div>
            {:else if addNameInputOpen}
              <div transition:slide={{ duration: 400 }}>
                <div class="field has-addons is-hidden-touch">
                  <div
                    class="control is-small"
                    style="width:50%"
                    class:is-loading={updatingUserName}>
                    <input
                      class="input is-small"
                      type="text"
                      placeholder="Choose your display name"
                      value={userName}
                      on:input={formatUserName}
                      disabled={updatingUserName} />
                  </div>
                  <div class="control">
                    {#if updatingUserName}
                      <button class="button is-light is-info is-small" disabled>
                        Please wait
                      </button>
                    {:else}
                      <button
                        class="button is-light is-info is-small"
                        on:click={updateName}>
                        Update
                      </button>
                      <button
                        class="button is-light is-danger is-small"
                        on:click={() => {
                          addNameInputOpen = false;
                        }}>
                        Cancel
                      </button>
                    {/if}
                  </div>
                </div>
                <div class="is-hidden-desktop">
                  <div
                    class="control is-small"
                    style="width:100%"
                    class:is-loading={updatingUserName}>
                    <input
                      class="input is-small"
                      type="text"
                      placeholder="Choose your display name"
                      value={userName}
                      on:input={formatUserName}
                      disabled={updatingUserName} />
                  </div>
                  {#if updatingUserName}
                    <button class="button is-light is-info is-small" disabled>
                      Please wait
                    </button>
                  {:else}
                    <div class="buttons" style="padding:10px">
                      <button
                        class="button is-light is-info is-small"
                        on:click={updateName}>
                        Update
                      </button>
                      <button
                        class="button is-light is-danger is-small"
                        on:click={() => {
                          addNameInputOpen = false;
                        }}>
                        Cancel
                      </button>
                    </div>
                  {/if}
                </div>
                <div class="is-size-7">
                  A fee of ꜩ {$store.storage.updateNameFee / 1000000} will be
                  charged to reserve your unique blogger name.
                </div>
              </div>
            {:else}
              <button
                class="button is-small is-light is-info"
                on:click={() => (addNameInputOpen = true)}>
                Add your name
              </button>
            {/if}
          </div>
        </div>
        <div class="columns is-mobile">
          <div class="column is-two-fifth">Total Tips</div>
          <div class="column is-three-fifths">
            ꜩ {$store.bloggerAccount.tips.toNumber() / 1000000}
          </div>
        </div>
        <div class="columns is-mobile">
          <div class="column is-two-fifth">Current Balance</div>
          <div class="column is-three-fifths">
            ꜩ {$store.bloggerAccount.balance.toNumber() / 1000000}
          </div>
        </div>
        {#if $store.favoriteList && $store.favoriteList.length > 0}
          <div class="columns is-mobile">
            <div class="column is-two-fifth">Favorite bloggers</div>
            <div class="column is-three-fifths">
              <div class="dropdown" class:is-active={displayFavoriteList}>
                <div class="dropdown-trigger">
                  <button
                    class="button is-info is-light is-small"
                    aria-haspopup="true"
                    aria-controls="dropdown-menu"
                    on:click={() => (displayFavoriteList = !displayFavoriteList)}
                    on:blur={() => (displayFavoriteList = false)}>
                    <span>Favorite list</span>
                    <span class="icon is-small">
                      <img
                        src="menu-icons/chevron-down.svg"
                        alt="chevron down" />
                    </span>
                  </button>
                </div>
                <div class="dropdown-menu" role="menu">
                  <div class="dropdown-content">
                    {#each $store.favoriteList as favorite}
                      <a
                        href="#"
                        class="dropdown-item"
                        on:click|preventDefault={() => push(`#/blogger/${favorite}`)}>
                        {#await $store.storage.bloggers.get(favorite)}
                          Loading...
                        {:then blogger}
                          {#if blogger.name}
                            {blogger.name}
                          {:else}{store.shortenAddress(favorite)}{/if}
                        {:catch error}
                          {store.shortenAddress(favorite)}
                        {/await}
                      </a>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}
        <hr />
        <h1 class="title is-size-4">Blog Posts</h1>
        {#if $store.bloggerAccount.postsList.length === 0}
          <div in:fade={{ delay: 400 }}>
            <button
              class="button is-primary is-light is-small"
              on:click={() => push('/upload')}>
              Write your first post!
            </button>
          </div>
        {:else}
          {#each $store.bloggerAccount.postsList as title}
            <div
              class="columns is-mobile"
              out:fly={waitingForRemoval ? { x: 200, duration: 400 } : { x: 0, duration: 0 }}>
              {#await $store.bloggerAccount.posts.get(title)}
                <div class="column is-12">Loading post data...</div>
              {:then post}
                <div class="column is-two-fifths has-text-left">
                  <a
                    href={`/#/post/${$store.bloggerAccount && $store.bloggerAccount.name ? $store.bloggerAccount.name : $store.userAddress}/${title}`}>
                    {decodeURIComponent(title)}
                  </a>
                </div>
                <div class="column is-two-fifths has-text-centered">
                  <span class="is-size-7">
                    {moment(Date.parse(post.timestamp)).format('MMM Do Y')}
                  </span>
                </div>
                <div class="column is-one-fifth has-text-right">
                  {#if waitingForRemoval === post.ipfs_hash}
                    <button class="button is-danger is-loading is-small">
                      Loading
                    </button>
                  {:else}
                    <img
                      class="menu-icon"
                      src="menu-icons/trash.svg"
                      alt="delete"
                      on:click={() => {
                        hashToDelete = post.ipfs_hash;
                        deletePostModal = true;
                      }} />
                  {/if}
                </div>
              {/await}
            </div>
          {/each}
        {/if}
      {:else if $store.bloggerAccount === null}
        <div>You must create an account to see your profile!</div>
      {/if}
    </div>
  </div>
</main>
