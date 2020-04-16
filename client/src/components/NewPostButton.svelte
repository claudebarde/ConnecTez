<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import moment from "moment";

  const dispatch = createEventDispatcher();
  let lastPostDelay, lastPost, lastPostInterval, timeLeft, timeUnit;
  let interval = 15;

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
  <button class="button is-warning is-light" disabled>
    Please wait {timeLeft} {timeLeft === 1 ? timeUnit.slice(-1) : timeUnit}
    before uploading a new post
  </button>
{:else}
  <button class="button is-link is-light" on:click={() => dispatch('upload')}>
    Upload
  </button>
{/if}
