# tellstick-confparser

Tellstick-confparser is a package to read, parse and save [tellstick.conf]-files. I wanted a way to edit the tellstick.conf file through an admin interface instead of manually editing the file, so the parser parses the content of the .conf-file and returns it as JSON. It can then take a modified JSON and save it in the tellstick.conf syntax. 

NOTE: You'll need to restart the telldusd service after modifing the tellstick.conf file! 

### Version
1.0.1

### Installation

Install tellstick-confparser with npm:

```sh
$ npm install tellstick-confparser
```

Read the content of your tellstick.conf file and log the resulting JSON:
```node
var tsParser = require('tellstick-confparser');
var configJson = tsParser.parseConfigFile( '/etc/tellstick.conf' );
console.log( configJson );
```


### Todos

 - Write Tests

### License

MIT

[tellstick.conf]: http://developer.telldus.com/wiki/TellStick_conf