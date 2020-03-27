autocmd BufEnter * call SetTabStop()

" For .ts files: Use 2 spaced for indentation
fun! SetTabStop()
	if buffer_name("%") =~ '\.ts$'
		set tabstop=2
		set softtabstop=0
		set expandtab
	else
		set tabstop=4
		set noexpandtab
	endif
endfun

