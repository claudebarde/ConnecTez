<script>
  import { createEventDispatcher, onMount } from "svelte";
  import snarkdown from "snarkdown";
  import insertTextAtCursor from "insert-text-at-cursor";

  export let post, title, banner;
  const dispatch = createEventDispatcher();
  let contentIsTooBig = false;
  let preview = false;
  let textareaRef;

  const byteLength = str => {
    // returns the byte length of an utf8 string
    var s = str.length;
    for (let i = str.length - 1; i >= 0; i--) {
      const code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) s++;
      else if (code > 0x7ff && code <= 0xffff) s += 2;
      if (code >= 0xdc00 && code <= 0xdfff) i--; //trail surrogate
    }
    if (s / 1024 < 1) {
      return s + " B";
    } else {
      if (Math.round(s / 1024) >= 10) {
        contentIsTooBig = true;
      } else {
        contentIsTooBig = false;
      }

      return Math.round(s / 1024) + " kB";
    }
  };

  onMount(() => {
    textareaRef = document.getElementById("editor");
  });
</script>

<style>
  .upload-textarea {
    height: 400px;
  }

  .upload-markdown {
    height: 400px;
    overflow: auto;
  }

  .icons-container {
    width: 100%;
    text-align: right;
  }

  .markdown-icon {
    display: inline-block;
    cursor: pointer;
    opacity: 0.5;
    transition: 0.4s;
  }
  .markdown-icon:hover {
    opacity: 1;
  }
</style>

<div class="tabs is-small">
  <ul>
    <li class:is-active={!preview} on:click={() => (preview = false)}>
      <a>Write</a>
    </li>
    <li class:is-active={preview} on:click={() => (preview = true)}>
      <a>Preview</a>
    </li>
    <li class="icons-container">
      <div>
        <div
          class="markdown-icon"
          on:click={() => {
            insertTextAtCursor(textareaRef, '****');
          }}>
          <span class="icon is-small">
            <img src="menu-icons/bold.svg" alt="bold" />
          </span>
        </div>
        <div
          class="markdown-icon"
          on:click={() => {
            insertTextAtCursor(textareaRef, '**');
          }}>
          <span class="icon is-small">
            <img src="menu-icons/italic.svg" alt="italic" />
          </span>
        </div>
        <div
          class="markdown-icon"
          on:click={() => {
            insertTextAtCursor(textareaRef, '> ');
          }}>
          <span class="icon is-small">
            <img src="menu-icons/terminal.svg" alt="terminal" />
          </span>
        </div>
        <div
          class="markdown-icon"
          on:click={() => {
            insertTextAtCursor(textareaRef, '` `');
          }}>
          <span class="icon is-small">
            <img src="menu-icons/code.svg" alt="code" />
          </span>
        </div>
        <div
          class="markdown-icon"
          on:click={() => {
            insertTextAtCursor(textareaRef, '[text](url)');
          }}>
          <span class="icon is-small">
            <img src="menu-icons/link.svg" alt="link" />
          </span>
        </div>
        <div
          class="markdown-icon"
          on:click={() => {
            insertTextAtCursor(textareaRef, '![alt](url)');
          }}>
          <span class="icon is-small">
            <img src="menu-icons/image.svg" alt="image" />
          </span>
        </div>
      </div>
    </li>
  </ul>
</div>
{#if preview}
  <div class="upload-markdown has-text-left content">
    {#if banner.url}
      {@html snarkdown('#' + title + '  \r\n' + `![banner](${banner.url})` + post)}
    {:else}
      {@html snarkdown('#' + title + '  \r\n' + post)}
    {/if}
  </div>
{:else}
  <textarea
    id="editor"
    class="textarea upload-textarea"
    class:is-danger={contentIsTooBig}
    placeholder="Write your post here"
    bind:value={post}
    on:input={() => dispatch('write', post)} />
  <div
    class="has-text-right is-size-7"
    class:has-text-danger={contentIsTooBig}
    style="padding:5px">
    {byteLength(post)}
  </div>
{/if}
