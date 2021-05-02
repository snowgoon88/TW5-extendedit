TW5-extendedit
==============

Plugin to extend the editor of TiddlyWiki5 with 'link completion'.

:zap: **NEW** :zap: can use mouse click or touch to select a completion option

**Try it** at http://snowgoon88.github.io/TW5-extendedit

**Upload it** from http://snowgoon88.github.io/TW5-extendedit

**Config** :zap: **NEW** :zap: nothing to do, autocompletion works as soon the plugin is enabled.

For older version of TW5 - prior to v5.1.22 -, you still must explicitely use the comptext editor. => In `$:/ControlPanel -> Advanced -> Editor Type -> text/vnd.tiddlywiki` you must chose **comptext** instead of **text**. Reload and « voilà »...

Dev
---

### Making demo onfile html
* The `edition/edit-comptextdemo` directory should be copied/linked into `$TW5HOME/editions` directory
* Then in `$TW5HOME`, run `nodejs ./tiddlywiki.js editions/edit-comptextdemo --build index` to create a stand alone `edit-comptextdemo.html` demo in `$TW5HOME/editions/edit-comptextdemo/output`

### Develop with nodejs
* Set up 'TIDDLYWIKI_EDITION_PATH' to 'edition'
* Link '$TW5HOME/plugins/snowgoon88/edit-comptext' to 'plugin'
* Create a local dev_rep `nodejs ./tiddlywiki.js dev_rep --init edit-comptextdev `
* Run local server `nodejs ./tiddlywiki.js dev_rep --server`

### Contributors
* [zimiarh](https://github.com/zimiarh)
* [saqimtiaz](https://github.com/saqimtiaz)

Older Stuff
-----------
* 16/04/2021 : v0.9.3 with click/touch selection
* 29/06/2020 : v0.9 default editor in TW5 now automatically has autocompletion
  * can use '||' trigger in order to create Links with Alias.
* 12/02/2018 : v0.8.1 fix small bug (minPatLength)
* 10/06/2018 : v0.8.0 config triggerKeys and FIX partial completion
  * (thanks to [zimiarh](https://github.com/zimiarh) )
* 28/05/2017 : v0.7.0 compatible with toolbar text editor
  * available at http://snowgoon88.github.io/TW5-extendedit/index_5.1.13.html
* 04/05/2016 : v0.6.1 self-sufficient module, use of body of tiddlers
  * available at http://snowgoon88.github.io/TW5-extendedit/index_5.1.08.html

* 26/04/2016 : v0.5.0 Completion Templates
* 07/03/2017 : v0.4.1 Fix small bug in naming config tiddler
* 07/03/2017 : v0.4 Configuration in 'config' tiddler.
* 29/02/2016 : v0.3 Can use CTRL+SPACE, UP/DOWN, ESC.
* 22/01/2016 : v0.2 Completion with Title that match pattern
* 12/28/2015 : v0.1 First real TW5 plugin
* 12/26/2015 : Second Version
  as a stand alone TW5 file : Sandbox/tw5_one_file.html
* 2014 : First Version
  a first prototype in Sandbox/index.html
