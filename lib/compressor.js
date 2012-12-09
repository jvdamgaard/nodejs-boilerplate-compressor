var less = require('less'),
  fs = require('fs'),
  url = require('url'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  crypto = require('crypto');

var error = function(err) {
    console.log(err);
  };

var lessCompressor = function(options) {
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

    var watch = function() {
        if(!options.production) {

          console.log('LESS: Watch all import files');
          // console.log(files);
          files.forEach(function(file, index) {
            fs.watch(options.lessPath+'/'+file, function(event, file) {
              if(event === 'change') {
                compile();
              }
            });
          });
        }
      };

    // Force compile on server start
    compile(watch);


  };

module.exports = function(options) {
  options = options || {};

  // LESS
  if(options.less.lessPath) {
    lessCompressor(options.less);
  }

};