<script>
  import Avatars from "@dicebear/avatars";
  import sprites from "@dicebear/avatars-bottts-sprites";
  import { onMount } from "svelte";

  export let seed;
  let svg;

  onMount(async () => {
    /*let options = { width: 36, height: 36 };
    let avatars = new Avatars(sprites, options);
    svg = avatars.create(seed);*/
  });
</script>

<style>
  .identicon {
    vertical-align: middle;
    margin-left: 20px;
  }

  .img-avatar {
    height: 66px;
    width: 66px;
    min-width: 66px;
  }
</style>

<!--<span class="identicon">
  {@html svg}
</span>-->
<img
  src={`https://services.tzkt.io/v1/avatars/${seed}`}
  alt="identicon"
  class="img-avatar" />
