<script>
  import { onMount } from "svelte";
  export let tips;

  let stars = undefined;

  $: switch (true) {
    // between 0 and .999 tez
    case tips > 0 && tips < 1000000:
      stars = [];
      break;
    // between 1 and 4.999 tez
    case tips >= 1000000 && tips < 5000000:
      stars = ["star"];
      break;
    // between 5 and 9.999 tez
    case tips >= 5000000 && tips < 100000000:
      stars = ["star", "star"];
      break;
    // between 10 and 49.999 tez
    case tips >= 10000000 && tips < 50000000:
      stars = ["star", "star", "star"];
      break;
    // starting from 50 tez
    case tips >= 50000000:
      stars = ["star", "star", "star", "star"];
      break;
    default:
      console.log(tips);
      stars = [];
      break;
  }
</script>

<style>
  .stars {
    display: inline-block;
    vertical-align: middle;
    padding-left: 10px;
  }
</style>

<div class="stars">
  {#each stars as star}
    <img src="menu-icons/star.svg" alt="star" />
  {:else}
    <span />
  {/each}
</div>
