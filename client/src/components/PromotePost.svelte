<script>
  import { fade, fly } from "svelte/transition";
  import store from "../store/store.js";
  import config from "../config.js";
  import Loader from "./Loader.svelte";

  export let author, ipfsHash;
  let openPromotionModal = undefined; // confirmation, waitingForBlockchain, confirmed
  let selectPromotionDays = 0;
  let txHash, errorMessage;

  const changePromotionDays = event =>
    (selectPromotionDays = parseInt(event.target.value));

  const promotePost = async () => {
    if (
      ipfsHash &&
      selectPromotionDays &&
      $store.storage.highlightFee.toNumber()
    ) {
      openPromotionModal = "waitingForBlockchain";
      try {
        const op = await $store.contractInstance.methods
          .addHighlight(selectPromotionDays, ipfsHash)
          .send({
            amount:
              $store.storage.highlightFee.toNumber() * selectPromotionDays,
            mutez: true
          });
        txHash = op.hash;
        await op.confirmation(1);
        openPromotionModal = "confirmed";
      } catch (error) {
        console.log(error);
        errorMessage = JSON.stringify(error);
        openPromotionModal = "error";
        txHash = undefined;
        selectPromotionDays = 0;
      }
    }
  };
</script>

<style>
  .button-icon {
    opacity: 0.5;
  }
  .button-text {
    padding-left: 5px;
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

  .promotion-line {
    padding-bottom: 15px;
  }
</style>

{#if openPromotionModal === 'confirmation'}
  <div
    class="modal has-text-left"
    class:is-active={openPromotionModal === 'confirmation'}>
    <div
      class="modal-background"
      in:fade={{ duration: 200 }}
      out:fade={{ delay: 100, duration: 200 }} />
    <div
      class="modal-content"
      in:fly={{ y: -200, duration: 400, delay: 100 }}
      out:fly={{ y: -200, duration: 400, delay: 0 }}>
      <div class="box">
        <h2 class="subtitle">Do you want to promote your post?</h2>
        <p class="promotion-line">
          When you promote your post, it will appear at the top of the other
          blog posts on the front page.
        </p>
        <p class="promotion-line">
          Visitors of ConnecTez will see your post first during the period of
          your choice.
        </p>
        <p class="promotion-line">
          The current price to see your post in the highlight section is ꜩ {$store.storage.highlightFee.toNumber() / 1000000}
          per day.
        </p>
        <p class="promotion-line">
          Please note that due to the way timestamps are inserted into the
          blockchain, a period of one day will be 24 hours plus or minus a few
          minutes.
          <br />
          Only continue if you accept this difference.
        </p>
        <div class="promotion-line">
          <p class="promotion-line">
            Please select the number of days you want your post to be promoted:
          </p>
          <div class="columns is-mobile">
            <div class="column is-one-third">
              <div class="select is-small">
                <select on:change={changePromotionDays}>
                  <option value="0">Select number of days</option>
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="4">4 days</option>
                  <option value="7">7 days</option>
                  <option value="10">10 days</option>
                  <option value="14">14 days</option>
                  <option value="21">21 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </div>
            <div class="column is-one-third">
              {#if !$store.storage.highlightFee}
                Price: ꜩ 0
              {:else}
                Price: ꜩ {($store.storage.highlightFee.toNumber() / 1000000) * selectPromotionDays}
              {/if}
            </div>
          </div>
        </div>
        <div class="confirm-buttons">
          <button
            class="button is-danger is-light"
            on:click={() => (openPromotionModal = undefined)}>
            Cancel
          </button>
          <button
            class="button is-success is-light"
            disabled={!selectPromotionDays}
            on:click={promotePost}>
            Confirm
          </button>
        </div>
      </div>
    </div>
    <button
      class="modal-close is-large"
      aria-label="close"
      on:click={() => (openPromotionModal = undefined)} />
  </div>
{/if}
<!-- MODAL WAITING FOR CONFIRMATION FROM BLOCKCHAIN -->
<div
  class="modal"
  class:is-active={openPromotionModal === 'waitingForBlockchain'}>
  <div class="modal-background" />
  <div class="modal-content">
    <div class="box">
      <article class="media">
        <figure class="media-left">
          <p class="image is-64x64">
            <img src="tezos.svg" alt="tezos-logo" class="image is-64x64" />
          </p>
        </figure>
        <div class="media-content">
          {#if txHash}
            <p>
              <strong>Waiting for confirmation from Tezos blockchain</strong>
            </p>
            <p>This may take a few seconds, please wait.</p>
            <br />
            {#if txHash}
              <p class="is-size-7">Transaction Hash: {txHash}</p>
            {/if}
          {:else}
            <p>
              <strong>Please approve the transaction to continue.</strong>
            </p>
          {/if}
        </div>
        {#if txHash}
          <div class="media-right">
            <p class="image is-64x64">
              <Loader
                color="#ffffff"
                size={{ width: '64px', height: '64px' }} />
            </p>
          </div>
        {/if}
      </article>
    </div>
  </div>
</div>
<!-- MODAL CONFIRMATION -->
<div class="modal" class:is-active={openPromotionModal === 'confirmed'}>
  <div class="modal-background" />
  <div class="modal-content">
    <div class="box">
      <article class="media">
        <figure class="media-left">
          <p class="image is-64x64">
            <img src="ipfs-tezos.png" alt="tezos-ipfs" class="image is-64x64" />
          </p>
        </figure>
        <div class="media-content">
          <p>
            <strong>
              Your post has been successfully added to our promoted posts!
            </strong>
          </p>
          <p>
            It will appear at the top of our posts list for {selectPromotionDays}
            day{selectPromotionDays > 1 ? 's' : ''}
          </p>
          <p>Transaction Hash: {txHash}</p>
        </div>
      </article>
    </div>
  </div>
  <button
    class="modal-close is-large"
    aria-label="close"
    on:click={() => {
      openPromotionModal = undefined;
    }} />
</div>
<!-- MODAL ERROR -->
<div class="modal" class:is-active={openPromotionModal === 'error'}>
  <div class="modal-background" />
  <div class="modal-content">
    <div class="box">
      <article class="media">
        <figure class="media-left">
          <p class="image is-64x64">
            <img src="error.png" alt="error" />
          </p>
        </figure>
        <div class="media-content">
          <p>
            <strong>An error has occured</strong>
          </p>
          <p>Please try again later.</p>
          <p>Error message: {errorMessage || 'No error message provided'}</p>
        </div>
      </article>
    </div>
  </div>
  <button
    class="modal-close is-large"
    aria-label="close"
    on:click={() => (openPromotionModal = undefined)} />
</div>
{#if $store.userAddress === author && config.DEV_ENV === 'local'}
  <button
    class="button is-success is-small"
    class:is-light={!$store.darkMode}
    on:click={() => (openPromotionModal = 'confirmation')}>
    <span class="icon is-small">
      <img src="menu-icons/users.svg" alt="audience" class="button-icon" />
    </span>
    <span class="button-text">Promote this post</span>
  </button>
{/if}
