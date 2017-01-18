set nocompatible 
filetype off

set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

set completeopt-=preview 
let g:ycm_add_preview_to_completeopt = 0
let g:ycm_confirm_extra_conf = 0
let g:ycm_autoclose_preview_window_after_completion = 1
let g:ycm_autoclose_preview_window_after_insertion = 1

Plugin 'VundleVim/Vundle.vim'
Plugin 'Valloric/YouCompleteMe'
Plugin 'scrooloose/nerdtree'
Plugin 'tpope/vim-fugitive'
Plugin 'SirVer/ultisnips'
Plugin 'honza/vim-snippets'

let g:UltiSnipsExpandTrigger="<F3>"
let g:UltiSnipsJumpForwardTrigger="<c-b>"
let g:UltiSnipsJumpBackwardTrigger="<c-z>"

call vundle#end()

map <C-]> :YcmCompleter GoTo<Cr> 
map <C-n> :NERDTreeToggle<Cr>
nnoremap <F4> :! pm2 start bin/www --name="connect-four" --watch<Cr>
nnoremap <F5> :! pm2 stop connect-four<Cr>
nnoremap <F6> :! pm2 list<Cr>
nnoremap <F7> :! pm2 log<Cr>

filetype plugin indent on

