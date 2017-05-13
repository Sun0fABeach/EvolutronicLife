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
                    Border: true,
                    Water: true,
                    Beach: true,
                    Plant: true,
                    RainForest: true,
                    Protozoan: true,
                    Herbivore: true,
                    Carnivore: true
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
