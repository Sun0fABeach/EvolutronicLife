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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['watch']);
};
