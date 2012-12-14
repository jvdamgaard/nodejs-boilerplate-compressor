var less = require('less'),
  fs = require('fs'),
  path = require('path');

var error = function(err) {
    console.log(err);
  };

var lessCompressor = function(options, callback) {
    options = options || {};
    var publicObject = {};
    var files;

    options.optimization = options.optimization || 2;
    options.dumpLineNumbers = options.dumpLineNumbers || false;
    options.production = options.compress = options.production || false;
    options.cssPath = options.cssPath || options.lessPath;

    var parser = new less.Parser({
      paths: [options.lessPath],
      filename: options.lessPath + '.less',
      optimization: options.optimization,
      dumpLineNumbers: options.dumpLineNumbers
    });

    var compile = function(callback) {
        getFile(function(lessStr) {
          parser.parse(lessStr, function(err, tree) {
            if(err) {
              return error(err);
            }
            files = tree.rules.filter(function(rule) {
              return rule.path;
            }).map(function(rule) {
              return path.join(options.path, rule.path);
            });

            var css = tree.toCSS({
              compress: options.compress,
              yuicompress: options.compress
            });

            var cssFile = options.cssPath + '/' + options.file + '.css';

            mkdirp(path.dirname(cssFile), 777, function(err) {
              if(err) return error(err);
              console.log('LESS: recompiled ' + cssFile);
              fs.writeFile(cssFile, css, 'utf8', callback);
            });
          });
        });
      };

    var getFile = function(next) {
        fs.readFile(options.lessPath + '/' + options.file + '.less', 'utf8', function(err, str) {
          if(err) {
            return error(err);
          }
          next(str);
        });
      };

    var watch = function(callback) {
        if(!options.production) {

          console.log('LESS: Watch all import files');
          
          files.forEach(function(file, index) {
            fs.watch(options.lessPath+'/'+file, function(event, file) {
              if(event === 'change') {
                compile();
              }
            });
          });
        }
        callback();
      };

    // Force compile on server start
    compile(function() {
      watch(callback);
    });


  };

module.exports = function(options, callback) {
  options = options || {};

  if(options.less.lessPath) {
    lessCompressor(options.less, callback);
  } else {
    callback();
  }

};
