TW5-extendedit
==============

Plugin to extend the editor of TiddlyWiki5 with 'link completion'.

**Try it** at http://snowgoon88.github.io/TW5-extendedit

**Upload it** from http://snowgoon88.github.io/TW5-extendedit

**Config** Then, in `$:/ControlPanel -> Advanced -> Editor Type -> text/vnd.tiddlywiki` you must chose **comptext** instead of **text**.

Reload and « voilà »...

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

Older Stuff
-----------
* 07/03/2017 : v0.4 Configuration in 'config' tiddler.
* 29/02/2016 : v0.3 Can use CTRL+SPACE, UP/DOWN, ESC.
* 22/01/2016 : v0.2 Completion with Title that match pattern
* 12/28/2015 : v0.1 First real TW5 plugin
* 12/26/2015 : Second Version
  as a stand alone TW5 file : Sandbox/tw5_one_file.html
* 2014 : First Version
  a first prototype in Sandbox/index.html
