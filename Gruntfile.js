module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                esversion: 6,
                browser: true,
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
        },
        concat: {
            options: {
                stripBanners: {
                    block: true,
                    line: true
                }
            },
            build: {
                src: [
                    'scripts/map.js',
                    'scripts/helpers.js',
                    'scripts/tile.js',
                    'scripts/entities.js',
                    'scripts/translator.js',
                    'scripts/simulation.js',
                    'scripts/display.js',
                    'scripts/main.js',
                    'scripts/user_ctrl.js'
                ],
                dest: 'scripts/evolife.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['concat']);
};
