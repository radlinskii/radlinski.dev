---
title: "Why I'm choosing Windows when working in Neovim"
description: "Improve your Neovim workflow with a window picker plugin. Pick which split to open files in when using FzfLua and nvim-tree."
tldr: "How picking windows instead of splitting or going back between them helps me keep my flow when navigating Neovim."
pubDate: 2026-04-14
heroImage: "/posts/nvim-window-picker/choose-wisely.jpg"
heroImageAlt: "The \"You must choose but choose wisely\" meme"
---

> I couldn't resist making this pun in the title. Sorry not sorry.

Of course, I don't mean Windows OS is my go to when working in Neovim.

What I actually wanted to show, is how using widow picker is helping me stay focused without disrupting my focus when working in Neovim.

## The workflow

When for example debugging something, a lot of times I want to open declaration of some function for example, but not in just a brief preview (like when you hover your mouse at something) but to have it in place so I can check it out more often.

That's not a problem, I just split the window vertically in two, go into the secondary window and use the `lsp` to go to the definition of thing I'm interested in.

There's even builtin mapping for opening definition of a keyword under cursor in new window: `h CTRL-W_d`.

### The problem

One issue here is that I usually am working with split windows, and when I want to go to a definition of a variable, sometimes I would like to be able to open it in a secondary window I have already opened.

The other thing is that many times I'm interested not in just definition, but in references. That's more tricky because I first want to pick the one reference I want to follow.

For listing and picking nodes such as references I use FzfLua. It also features previews of file so I can have already a glance at each entry there. But let's say after having a quick look I decide I want to open the file with reference in the secondary window.

If I know that this is what I want to do beforehand, I could first focus on the secondary window and then just pick the reference that interests me to have it opened there.

But what if I only decide I want to have the reference in split window after I already started looking at the preview of it.

## Picker for the win

> I'm still ain't sorry about those puns.

With window picker, I can finally have it both ways.

I'm in the FzfLua picker, browsing references. The preview looks good — but opening it in the current window would mess up my layout. So instead of `<Enter>`, I press `<M-o>`.

Big floating letters appear on each open window. I tap the one I want, and the file opens there. My place in the original buffer is intact. That's it.

![Window picker demo with letter labels appearing to pick window](/posts/nvim-window-picker/window-picker-demo.gif)

Works the same for file pickers, grep results, diagnostics — any FzfLua source.

Here is the setup needed for the `fzf-lua` integration.

```lua
local actions = require("fzf-lua").actions

local function edit_in_picked_window(selected, opts)
  local win = require("window-picker").pick_window()
    or vim.api.nvim_get_current_win()
  vim.api.nvim_set_current_win(win)
  actions.file_edit(selected, opts)
end

require("fzf-lua").setup({
  actions = {
    files = {
      ["alt-o"] = edit_in_picked_window,
    },
  },
})
```

## Other use cases

I have similar mappings done in `nvim-tree` configuration. I can decide in which of the current opened windows I would like the focused file to be opened.

By default, `<Enter>` and `<Right>` open files directly — fast path. But `<M-o>` triggers the window picker.

```lua
vim.keymap.set("n", "<M-o>", api.node.open.edit, opts("Open: with picker"))
```

Under the hood, nvim-tree uses the same `require("window-picker").pick_window` function. Same floating letters, same flow.

It's a small quality of life improvement. But once you get used to it, you can't go back.
