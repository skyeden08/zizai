# Right Panel V1

```html
<zizai-right-panel id="right-panel"></zizai-right-panel>
<script type="module">
  import './zizai-right-panel.js';

  const panel = document.getElementById('right-panel');
  panel.setWorkspaces([
    { id: 'workspace-a', label: 'Workspace A', content: '...' },
    { id: 'workspace-b', label: 'Workspace B', content: '...' }
  ]);
  panel.setFavorites(['workspace-a']);

  panel.addEventListener('zizai-workspace-changed', (event) => {
    console.log(event.detail);
  });
</script>
```

Available methods: `setWorkspaces()`, `getWorkspaces()`, `setFavorites()`, `getFavorites()`, `setActiveWorkspace()`, and `getActiveWorkspace()`.
