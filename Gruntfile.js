
module.exports = function(grunt) {
'use strict';

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({

        // Define Directory
        dirs: {
            js:     'src/js',
            css:    'src/css',
            build:  'dist'
        },

        // Metadata
        pkg: grunt.file.readJSON('package.json'),
        banner:
         '/*\n' +
         ' * <%= pkg.title %> v<%= pkg.version %>\n' +
         ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
         ' * License: MIT (<%= pkg.licenses[0].url %>)\n' +
         ' */\n',

        // Lint js
        jshint: {
            options: {
              jshintrc: true
            },
            files: ['Gruntfile.js', 'src/js/*.js']
        },

        // Minify js
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
              files: {
                  '<%= dirs.build %>/angular-datetime-scroller.min.js': '<%= dirs.js %>/angular-datetime-scroller.js'
              }
            }
        },

        // Minify css
        cssmin: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
              files: {
                  '<%= dirs.build %>/angular-datetime-scroller.min.css': '<%= dirs.css %>/angular-datetime-scroller.css'
              }
            }
        }
    });


    // Register Taks
    // --------------------------

    // Observe changes, concatenate, minify and validate files
    grunt.registerTask('default', ['jshint', 'uglify', 'cssmin']);

};
