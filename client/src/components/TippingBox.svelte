<script>
  import { createEventDispatcher } from "svelte";
  import { slide } from "svelte/transition";
  import store from "../store/store.js";
  import Loader from "../components/Loader.svelte";

  export let blogger, bloggersAccount;

  const dispatch = createEventDispatcher();
  const tippingAmounts = ["0.1", "0.2", "0.5", "0.8", "1", "2", "5"];
  let selectedAmount, txHash, error, confirmed;

  const tip = async amount => {
    error = false;
    selectedAmount = amount;
    try {
      // checks if blogger's account exists
      if (!bloggersAccount) throw "NoBloggerAccountProvided";
      // sends transaction
      const op = await bloggersAccount.methods
        .tip([["unit"]])
        .send({ amount: parseFloat(amount) * 1000000, mutez: true });
      txHash = op.hash;
      await op.confirmation(1);
      confirmed = true;
      // turns state back to default after 4 seconds
      setTimeout(async () => {
        dispatch("closeModal", true);
        confirmed = false;
        txHash = undefined;
        // updates user's balance
        store.updateUserBalance(
          await $store.TezosProvider.tz.getBalance($store.userAddress)
        );
      }, 4000);
    } catch (err) {
      error = true;
      console.log(err);
    }
  };
</script>

{#if error}
  <article class="message is-danger">
    <div class="message-body">
      An error has occured, please try again later.
    </div>
  </article>
{:else}
  <article class="message is-info" transition:slide={{ duration: 400 }}>
    <div class="message-body">
      {#if txHash}
        <div class="media">
          {#if !confirmed}
            <div class="media-content">
              <p>
                Sending XTZ {selectedAmount} to {store.shortenAddress(blogger)}...
              </p>
              <p class="is-size-7">Hash: {txHash}</p>
            </div>
            <div class="media-right">
              <p class="image is-64x64">
                <Loader
                  color="#EDF6FC"
                  size={{ width: '64px', height: '64px' }} />
              </p>
            </div>
          {:else}
            <div class="media-content">
              <p>Tip successfully sent, thank you!</p>
              <p class="is-size-7">Hash: {txHash}</p>
            </div>
          {/if}
        </div>
      {:else}
        <div>How much would you like to tip?</div>
        <br />
        <div class="tags">
          {#each tippingAmounts as amount}
            <span
              class="tag is-info"
              style="cursor:pointer"
              on:click={() => tip(amount)}>
              XTZ {amount}
            </span>
          {/each}
        </div>
      {/if}
    </div>
  </article>
{/if}
