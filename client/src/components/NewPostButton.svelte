<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import moment from "moment";
  import store from "../store/store.js";
  import config from "../config.js";

  const dispatch = createEventDispatcher();
  let lastPostDelay, lastPost, lastPostInterval, timeLeft, timeUnit;
  let interval = config.DEV_ENV === "local" ? 1 : 15;

  const calculateTimeLeft = () =>
    moment(lastPost + interval * 60 * 1000).diff(moment(Date.now()), timeUnit);

  onMount(() => {
    if (window.localStorage && window.localStorage.getItem("lastPost")) {
      lastPost = parseInt(window.localStorage.getItem("lastPost"));
      if (Date.now() < lastPost + interval * 60 * 1000) {
        lastPostDelay = true;
        timeUnit = "minutes";
        const tempTimeLeft = calculateTimeLeft();
        if (tempTimeLeft === 0) {
          timeUnit = "seconds";
          timeLeft = calculateTimeLeft();
        } else {
          timeLeft = tempTimeLeft;
        }
        lastPostInterval = setInterval(() => {
          timeUnit = "minutes";
          const tempTimeLeft = calculateTimeLeft();
          if (tempTimeLeft === 0) {
            timeUnit = "seconds";
            timeLeft = calculateTimeLeft();
          } else {
            timeLeft = tempTimeLeft;
          }
          lastPostDelay = Date.now() < lastPost + interval * 60 * 1000;
        }, 5000);
      } else {
        lastPostDelay = false;
      }
    } else {
      lastPostDelay = false;
    }
  });
</script>

{#if lastPostDelay}
  <div class="message is-warning is-small">
    <div class="message-body">
      Creating a good blog post takes some time :)
      <br />
      Please wait {timeLeft} {timeLeft === 1 ? timeUnit.slice(0, -1) : timeUnit}
      before uploading a new post
    </div>
  </div>
{:else}
  {#if $store.userBalance.toNumber() < 30000}
    <div class="message is-warning is-small">
      <div class="message-body">
        You must have at least ꜩ 0.03 in your wallet to create a new post.
      </div>
    </div>
  {:else}
    <button class="button is-link is-light" on:click={() => dispatch('upload')}>
      Upload
    </button>
  {/if}
{/if}
