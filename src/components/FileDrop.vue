<template>
<div class="file is-boxed"
  @drop.prevent="handleFiles('drop', $event)"
  @dragover.prevent="hovering = true"
  @dragleave.prevent="hovering = false"
  v-bind:class="{ 'is-warning': hovering }">
  <label class="file-label">
    <input class="file-input" type="file" @change="handleFiles('file', $event)">
    <span class="file-cta">
      <span class="file-icon">⬆</span>
      <span class="file-label" style="text-align: center" v-html="text"></span>
    </span>
  </label>
</div>
</template>

<script>
export default {
    props: {
        text: {
            type: String,
            default: 'Select or drop files here',
        },
    },
    data: () => ({
        hovering: false,
    }),
    methods: {
        handleFiles(type, event) {
            this.hovering = false;
            let files = type == 'drop' ? event.dataTransfer.files : event.target.files;
            this.$emit('received-files', files);
        },
    },
};
</script>
