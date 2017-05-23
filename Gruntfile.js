'use strict';
/* globals module: false */

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                esversion: 6,
                browser: true,
                strict: 'global',
                globals: {
                    map: true,
                    main: true,
                    simulation: true,
                    display: true,
                    translator: true,
                    user_ctrl: true,
                    helpers: true,
                    Tile: true,
                    entities: true
                }
            },
            all: ['*.js', 'scripts/**/*.js']
        },
        watch: {
            files: ['*.js', 'scripts/**/*.js'],
            tasks: ['jshint']
        },
        yuidoc: {
            compile: {
                name: 'Evolutronic Life',
                description: 'Documentation of modules, classes and methods',
                options: {
                    paths: 'scripts/',
                    outdir: 'doc/'
                }
            }
        },
        connect: {
            server: {
                options: {
                    keepalive: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.registerTask('default', ['watch']);
};
