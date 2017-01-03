var path = require('path');
var lgt = require('load-grunt-tasks');

module.exports = grunt => {
  lgt(grunt);


  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    babel: {
      options: {
        sourceMap: false,
        presets: [
          'es2015'
        ]
      },
      sources: {
        files: [{
          expand: true,
          cwd: 'public/sources/scripts',
          src: ['**/*.js'],
          dest: 'public/dist/scripts/'
        }]
      }
    },
    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    nodemon: {
      dev: {
        script: 'app.js',
        options: {
          ignore: [
            'node_modules/**',
            'public/**'
          ],
          ext: 'js'
        }
      }
    },
    watch: {
      clientJS: {
        files: [
          'public/sources/scripts/**/*.js'
        ],
        tasks: ['babel']
      },
      serverJS: {
        files: ['views/**/*.js'],
        tasks: ['newer:jshint:server']
      },
      sass: {
        files: [
          'public/sources/styles/**/*.scss'
        ],
        tasks: ['sass']
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        sourceMapName: function(filePath) {
          return filePath + '.map';
        }
      },
      layouts: {
        files: {
          'public/layouts/core.min.js': [
            'public/vendor/jquery/jquery.js',
            'public/vendor/jquery.cookie/jquery.cookie.js',
            'public/vendor/underscore/underscore.js',
            'public/vendor/backbone/backbone.js',
            'public/vendor/bootstrap/js/affix.js',
            'public/vendor/bootstrap/js/alert.js',
            'public/vendor/bootstrap/js/button.js',
            'public/vendor/bootstrap/js/carousel.js',
            'public/vendor/bootstrap/js/collapse.js',
            'public/vendor/bootstrap/js/dropdown.js',
            'public/vendor/bootstrap/js/modal.js',
            'public/vendor/bootstrap/js/tooltip.js',
            'public/vendor/bootstrap/js/popover.js',
            'public/vendor/bootstrap/js/scrollspy.js',
            'public/vendor/bootstrap/js/tab.js',
            'public/vendor/bootstrap/js/transition.js',
            'public/vendor/momentjs/moment.js',
            'public/layouts/core.js'
          ],
          'public/layouts/ie-sucks.min.js': [
            'public/vendor/html5shiv/html5shiv.js',
            'public/vendor/respond/respond.js',
            'public/layouts/ie-sucks.js'
          ],
          'public/layouts/admin.min.js': ['public/layouts/admin.js']
        }
      },
      views: {
        files: [{
          expand: true,
          cwd: 'public/views/',
          src: ['**/*.js', '!**/*.min.js'],
          dest: 'public/views/',
          ext: '.min.js'
        }]
      }
    },
    jshint: {
      client: {
        options: {
          jshintrc: '.jshintrc-client',
          ignores: [
            'public/layouts/**/*.min.js',
            'public/views/**/*.min.js'
          ]
        },
        src: [
          'public/layouts/**/*.js',
          'public/views/**/*.js'
        ]
      },
      server: {
        options: {
          jshintrc: '.jshintrc-server'
        },
        src: [
          'schema/**/*.js',
          'views/**/*.js'
        ]
      }
    },
    sass: {
      options: {
        noCache: true,
        sourcemap: 'none'
      },
      all: {
        files: {
          'public/dist/styles/reglament.css': 'public/sources/styles/reglament.scss'
        }
      }
    },
    clean: {
      js: {
        src: [
          'public/layouts/**/*.min.js',
          'public/layouts/**/*.min.js.map',
          'public/views/**/*.min.js',
          'public/views/**/*.min.js.map'
        ]
      },
      css: {
        src: [
          'public/layouts/**/*.min.css',
          'public/views/**/*.min.css'
        ]
      },
      vendor: {
        src: ['public/vendor/**']
      }
    }
  });

  grunt.registerTask("server-shutdown-listener", function(step) {
    var name = this.name;
    if (step === 'exit') process.exit();
    else {
      process.on("SIGINT", function() {
        grunt.log.writeln("").writeln("Shutting down server...");
        grunt.task.current.async()();
      });
    }
  });

  grunt.registerTask('default', [
    'babel',
    'sass',
    'server-shutdown-listener',
    'concurrent'
  ]);
  grunt.registerTask('build', [
    'uglify',
    'sass'
  ]);
  grunt.registerTask('lint', [
    'jshint'
  ]);
};