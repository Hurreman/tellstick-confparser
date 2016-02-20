/**
 * Parser for tellstick.conf-files ( http://developer.telldus.com/wiki/TellStick_conf ) used by Tellstick
 * @todo Write tests...
 */
var fs = require('fs');

module.exports = {
	/**
	 * Saves the config file to the specified file path
	 * @param json object 	The configuration to be saves as json
	 * @param path string 	The path to the saved configuration file
	 */
	saveConfigFile: function( json, path ) {
		var config = "";
		
		for( var key in json.root ) {
			config += key + " = " + this.printRealValue( json.root[ key ] ) + "\n";
		}
		config += "controller {\n";
		for( var key in json.controller ) {
			config += "  " + key + " = " + this.printRealValue( json.controller[ key ] ) + "\n";
		}
		config += "}\n";
		for( var i in json.devices ) {
			config += "device {\n";
			for( var key in json.devices[ i ] ) {
				if( key == 'parameters' ) {
					config += "  parameters {\n";
					for( var pKey in json.devices[ i ].parameters ) {
						config += "    " + pKey + " = " + this.printRealValue( json.devices[ i ].parameters[ pKey ] ) + "\n";
					}
					config += "  }\n";
				}
				else {
					config += "  " + key + " = " + this.printRealValue( json.devices[ i ][ key ] ) + "\n";
				}
			}
			config += "}\n";
		}

		fs.writeFile( path, config, (err) => {
			if ( err ) {
				throw err;	
			}
		} );
		
	},
	/**
	 * Return values as either ints or strings
	 * @param value mixed
	 * @return mixed
	 */
	printRealValue: function( value ) {
		if ( !isNaN( parseFloat( value ) ) ) {
			value = parseFloat( value );
		}
		else {
			value = '"' + value + '"';
		}
		return value;
	},
	/**
	 * Parse the specified config file
	 * @param string path	Path to the tellstick.conf file  (usually /etc/tellstic.conf)
	 * @return object
	 */
	parseConfigFile: function( path ) {

		var config = {
			root: {},
			controller: {},
			devices: [],
			commentedDevices: []
		};
		
		// Fetch data and parse as an array
		var configArr = fs.readFileSync( path ).toString().split( "\n" );

		var commentedDevices = this.getCommentedDevices( configArr );

		// Remove rows starting with a comment
		configArr = this.removeComments( configArr );

		var controllerIndex = this.findControllerIndex( configArr );
		var deviceIndexes 	= this.findDeviceIndexes( configArr );
		var devices = this.getDevices( configArr, deviceIndexes );
		var controller = this.getController( configArr, parseInt( controllerIndex ), parseInt( deviceIndexes[ 0 ] ) );
		var root = this.getRootConfig( configArr, controllerIndex );

		config.root = root;
		config.controller = controller;
		config.devices = devices;
		config.commentedDevices = commentedDevices;

		return config;
	},
	/**
	 * Get root configuration.
	 * These should be saved above the controller, which is why we use the controllerIndex as parameter
	 * @param configArr array	The config file as an array
	 * @param controllerIndex int	The array index of the controller
	 * @return object
	 */
	getRootConfig: function( configArr, controllerIndex ) {
		var root = {};

		for( var i = 0; i < controllerIndex; i++ ) {
			
			var row = configArr[ i ];
			
			if ( row.indexOf( "=" ) > -1 ) {
				tmpData = row.split( "=" );
				var key = tmpData[ 0 ].trim();
				var value = tmpData[ 1 ].trim()

				if ( !isNaN( parseFloat( value ) ) ) {
					value = parseFloat( value );
				}
				else {
					value = value.replace( /\"/g, '' );
				}

				root[ key ] = value;
			}
		}

		return root;
	},
	/**
	 * Get the controller configuration
	 * @param configArr array	The config file as an array
	 * @param controllerIndex int	The array index of the controller
	 * @param firstDeviceIndex int 	The array index of the first device
	 * @return object
	 */
	getController: function( configArr, controllerIndex, firstDeviceIndex ) {
		
		var controller = {};

		
		for( var i = controllerIndex; i < firstDeviceIndex; i++ ) {
			
			var row = configArr[ i ];
			
			if ( row.indexOf( "=" ) > -1 ) {
				tmpData = row.split( "=" );
				var key = tmpData[ 0 ].trim();
				var value = tmpData[ 1 ].trim()

				if ( !isNaN( parseFloat( value ) ) ) {
					value = parseFloat( value );
				}
				else {
					value = value.replace( /\"/g, '' );
				}

				controller[ key ] = value;
			}
		}

		return controller;
		
	},
	/**
	 * Find all occurances of "device" and return their indexes
	 * @param arr array 	The configuration file as an array
	 */
	findControllerIndex: function( arr ) {
		var index = false;
		for( var i in arr ) {
			if( arr[ i ].indexOf( "controller" ) > -1 && arr[ i ].indexOf( "{" ) > -1 ) {
				index = i;
				break;
			}
		}
		return index;
	},
	/**
	 * Get all devices from the configuration array
	 * @param deviceArr array 	The configuration file as an array
	 * @param deviceIndexes array 	An array of all device indexes
	 * @return array
	 */
	getDevices: function( deviceArr, deviceIndexes ) {

		// Find all instances of "device" and store their indexes in an array
		var numIndexes = deviceIndexes.length;
		var devices = [];
		// Iterate through all devices
		for( var i = 0; i < numIndexes; i++ ) {
			
			var device 		= {};
			var tmpData 	= [];
			var index 		= parseInt( deviceIndexes[ i ] );
			var nextIndex 	= parseInt( deviceIndexes[ i + 1 ] );
			var parameters 	= {};

			// If we've reached the last index, we'll just continue until the last row.
			if( typeof( deviceIndexes[ i + 1 ] ) == 'undefined' ) {
				nextIndex = deviceArr.length;
			}
			
			// Iterate over each row containing data for the current device.
			for( var j = index; j < nextIndex; j++ ) {
				
				var row = deviceArr[ j ];
				
				// Values
				if ( row.indexOf( "=" ) > -1 ) {
					tmpData = row.split( "=" );
					var key = tmpData[ 0 ].trim();
					var value = tmpData[ 1 ].trim()

					if ( !isNaN( parseFloat( value ) ) ) {
						value = parseFloat( value );
					}
					else {
						value = value.replace( /\"/g, '' );
					}

					device[ key ] = value;
				}
				// Parameters
				else if ( row.indexOf( "parameters" ) > -1 ) {
					for( var p = j; p < nextIndex; p++ ) {
						var param = deviceArr[ p ];
						if ( param.indexOf( "=" ) > -1 ) {
							tmpData = param.split( "=" );
							var key = tmpData[ 0 ].trim();
							var value = tmpData[ 1 ].trim()

							if ( !isNaN( parseFloat( value ) ) ) {
								value = parseFloat( value );
							}
							else {
								value = value.replace( /\"/g, '' );
							}

							parameters[ key ] = value;
						}
					}
					j = p;
				}
			}

			device.parameters = parameters;
			devices.push( device );
		}

		return devices;
	},
	/**
	 * Remove all lines containing "#"
	 * @param arr array		The configuration file as an array
	 * @return array	The array stripped of comments
	 */
	removeComments: function( arr ) {
		var newArr =  arr.filter( function( row ) {
			if ( row.indexOf( "#" ) !== -1 ) {
				return false;
			}
			else {
				return true;
			}
		});
		return newArr;
	},
	/**
	 * Returns all commented devices so that we can append them before saving, as we'll be calling removeComments before parsing all devices
	 * @param arr array		The configuration file as an array
	 * @return array	An array with all commented devices
	 */
	getCommentedDevices: function( arr ) {
		var commentedDevices =  arr.filter( function( row ) {
			if ( row.indexOf( "#" ) !== -1 ) {
				return true;
			}
			else {
				return false;
			}
		});
		return commentedDevices;
	},
	/**
	 * Find all occurances of "device" and return their index
	 * @param arr array		The configuration file as an array
	 * @return array
	 */
	findDeviceIndexes: function( arr ) {
		var deviceIndexes = [];

		for( var i in arr ) {
			if( arr[ i ].indexOf( "device" ) > -1 && arr[ i ].indexOf( "{" ) > -1 ) {
				deviceIndexes.push( i );
			}
		}
		return deviceIndexes;
	}
}