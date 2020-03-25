<script>
  import snarkdown from "snarkdown";
  import store from "../store/store";

  let preview = false;
  let title = "";
  let post = "";
  let uploadConfirm = false;

  const writePost = event => {
    post = event.target.value;
  };
</script>

<style>
  .upload-container {
    width: 50%;
    margin: 0 auto;
  }

  .upload-buttons {
    margin: 10px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .upload-textarea {
    height: 400px;
  }

  .upload-markdown {
    height: 400px;
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
</style>

{#if $store.userAddress}
  <div class="modal" class:is-active={uploadConfirm}>
    <div class="modal-background" />
    <div class="modal-content">
      <div class="box">
        <h2 class="subtitle">Confirm IPFS Upload?</h2>
        <p>Are you sure you want to upload this post to the IPFS?</p>
        <p>
          Content uploaded to the IPFS cannot be modified without modifying its
          reference hash.
        </p>
        <div class="confirm-buttons">
          <button
            class="button is-danger is-light"
            on:click={() => (uploadConfirm = false)}>
            Cancel
          </button>
          <button class="button is-success is-light">Confirm</button>
        </div>
      </div>
    </div>
    <button
      class="modal-close is-large"
      aria-label="close"
      on:click={() => (uploadConfirm = false)} />
  </div>
  <section class="hero is-medium is-fullheight-with-navbar">
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="upload-container">
          <h1 class="title">Write a new blog post</h1>
          <input
            class="input"
            type="text"
            placeholder="Post title"
            bind:value={title} />
          <p class="is-size-7" style="padding:10px 0px">
            Use Markdown to style your post
          </p>
          {#if preview}
            <div class="upload-markdown has-text-left content">
              {@html snarkdown(post)}
            </div>
          {:else}
            <textarea
              class="textarea upload-textarea"
              placeholder="Write your post here"
              bind:value={post}
              on:input={writePost} />
          {/if}
          <div class="upload-buttons">
            <button
              class="button is-light"
              on:click={() => (preview = !preview)}>
              {#if preview}Edit{:else}Preview{/if}
            </button>
            {#if !!title && !!post}
              <button
                class="button is-link is-light"
                on:click={() => (uploadConfirm = true)}>
                Upload
              </button>
            {:else}
              <button class="button is-warning is-light" disabled>
                Upload
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </section>
{:else}
  <section class="hero is-medium is-light is-bold is-fullheight-with-navbar">
    <div class="hero-body">
      <div class="container">
        <h1 class="title">Write a new blog post</h1>
        <h2 class="subtitle">Please connect your wallet to start.</h2>
      </div>
    </div>
  </section>
{/if}
