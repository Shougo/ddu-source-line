# ddu-source-line

Line source for ddu.vim

This source collects current buffer lines.

## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### ddu.vim

https://github.com/Shougo/ddu.vim

### ddu-kind-file

https://github.com/Shougo/ddu-kind-file

## Configuration

```vim
call ddu#start(#{ 'sources': [#{ name: 'line' }] })
```
