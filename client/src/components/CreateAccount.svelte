<script>
  import { afterUpdate } from "svelte";
  import { fade, fly } from "svelte/transition";
  import store from "../store/store";
  import bloggerAccount from "../bloggerAccount.json";
  import { MichelsonMap } from "@taquito/taquito";
  import config from "../config.js";

  let newAccountModal = false;
  let newAccountError = false;
  let confirmingNewAccount = false;
  let waitingForSavingNewAccount = false;
  let savingNewAccount = false;

  const confirmNewAccount = async () => {
    if (confirmingNewAccount) return;

    newAccountError = false;
    // creates user's account
    try {
      confirmingNewAccount = true;
      const originOp = await $store.TezosProvider.contract.originate({
        code: bloggerAccount,
        storage: {
          version: config.bloggerAccountVersion,
          postsList: [],
          posts: new MichelsonMap(),
          blogger: $store.userAddress,
          admin: config.adminAddress,
          info: new MichelsonMap(),
          tips: 0,
          hashLength: 46,
          hashChars: "Qm"
        }
      });
      const newAccount = await originOp.contract();
      // saving new address to main contract
      confirmingNewAccount = false;
      waitingForSavingNewAccount = true;
      const op = await $store.contractInstance.methods
        .addBlogger($store.userAddress, newAccount.address)
        .send();
      waitingForSavingNewAccount = false;
      savingNewAccount = true;
      await op.confirmation();
      // creates bloggers data
      const accountInstance = await $store.TezosProvider.contract.at(
        newAccount.address
      );
      const storage = await accountInstance.storage();
      const balance = await $store.TezosProvider.tz.getBalance(
        newAccount.address
      );
      store.updateBloggerAccount({
        account: newAccount.address,
        name: null,
        ...storage,
        balance,
        instance: accountInstance
      });
    } catch (err) {
      console.log(err);
      newAccountError = true;
    } finally {
      confirmingNewAccount = false;
      savingNewAccount = false;
      waitingForSavingNewAccount = false;
      newAccountModal = false;
    }
  };
</script>

<style>
  .confirm-buttons {
    margin: 20px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }

  .confirm-buttons button {
    margin-right: 10px;
  }

  .txs-list {
    list-style: inside square;
  }
</style>

{#if $store.userAddress}
  {#if newAccountModal}
    <div class="modal is-active">
      <div
        class="modal-background"
        in:fade={{ duration: 200 }}
        out:fade={{ delay: 100, duration: 200 }} />
      <div
        class="modal-content has-text-left"
        in:fly={{ y: -200, duration: 400, delay: 100 }}
        out:fly={{ y: -200, duration: 400, delay: 0 }}>
        <div class="box">
          <h2 class="subtitle">Confirm New Account?</h2>
          <p>Are you sure you want to create a new account?</p>
          <br />
          <p>Your new account will be associated with this address.</p>
          <br />
          <p>
            This action will create a separate smart contract that will contain
            references to your blog posts, all your tips and information (total
            fee should be between ꜩ 0,01 and ꜩ 0,02).
          </p>
          <br />
          <p>
            You will be required to confirm
            <strong>two</strong>
            transactions:
          </p>
          <ul class="txs-list">
            <li>
              In the first one, your account will be created and saved to the
              blockchain.
            </li>
            <li>
              In the second one, your account address will be saved into the
              main database. This step is extremely important as your account
              will not be considered valid if skipped.
            </li>
          </ul>
          <br />
          {#if confirmingNewAccount}
            <div class="message is-info">
              <div class="message-body">
                Waiting for your account to be deployed to the blockchain...
              </div>
            </div>
          {/if}
          {#if waitingForSavingNewAccount}
            <div class="message is-warning">
              <div class="message-body">
                Please confirm this transaction in the TezBridge window to save
                your newly created account into the main database.
              </div>
            </div>
          {/if}
          {#if savingNewAccount}
            <div class="message is-info">
              <div class="message-body">
                Waiting for your account to be saved into the main database...
              </div>
            </div>
          {/if}
          {#if newAccountError}
            <div class="message is-danger">
              <div class="message-body">
                There was an error saving your new account.
                <br />
                Please try again later.
              </div>
            </div>
          {/if}
          <div class="confirm-buttons">
            <button
              class="button is-danger is-light"
              on:click={() => (newAccountModal = false)}>
              Cancel
            </button>
            <button
              class="button is-success"
              class:is-loading={confirmingNewAccount || waitingForSavingNewAccount || savingNewAccount}
              class:is-light={!confirmingNewAccount && !waitingForSavingNewAccount && !savingNewAccount}
              on:click={confirmNewAccount}>
              Confirm
            </button>
          </div>
        </div>
      </div>
      <button
        class="modal-close is-large"
        aria-label="close"
        on:click={() => (newAccountModal = false)} />
    </div>
  {/if}
  {#if $store.bloggerAccount === undefined}
    <button class="button is-success is-loading">Loading</button>
  {:else if $store.bloggerAccount === null}
    <button
      class="button is-success is-large is-light"
      on:click={() => (newAccountModal = true)}>
      Create an account
    </button>
  {/if}
{:else}
  <div class="message is-info">
    <div class="message-body">Connect your wallet to create an account</div>
  </div>
{/if}
