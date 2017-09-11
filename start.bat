@echo off
:top
cls
set my_command=node
set my_params=index.js
start /WAIT %my_command% %my_params%
goto top