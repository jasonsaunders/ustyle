var autoprefixer = require('autoprefixer-core');

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  grunt.loadTasks('grunt/tasks');

  grunt.initConfig({
    shell: {
      publish : {
        command: 'bundle exec rake ustyle:publish'
      }
    },
    version: {
      project: {
        src: ['package.json', 'bower.json', 'lib/ustyle/version.rb']
      }
    },
    postcss: {
        options: {
            processors: [
              autoprefixer({ browsers: ['last 5 versions', 'Firefox 22', 'Explorer 8', '> 1%', 'Opera 12.1'] }).postcss
            ]
        },
        dist: { src: ['build/**/*.css', 'dist/**/*.css'] }
    },
    watch: {
      options: {
        spawn: false
      },
      build: {
        files: ['vendor/assets/**/*', 'styleguide/**/*', 'dist/ustyle.json'],
        tasks: ['styleguide', 'copy', 'sass', 'coffee', 'sassdoc', 'postcss', 'browserSync-inject', 'cssstats', 'builder']
      },
      scripts: {
        files: ['styleguide/**/*.js', 'vendor/**/*.coffee'],
        tasks: ['concat']
      }
    },
    svg2png: {
      dist: {
        src: 'vendor/assets/images/icons/',
        sizes: ["16 144", "32 288", "64 576"]
      }
    },
    svgmin: {
        dist: {
            files: [{
                expand: true,
                cwd: 'vendor/assets/images/icons/',
                src: "{,*/}*.svg",
                dest: 'vendor/assets/images/icons/'
            }]
        }
    },
    styleguide: {
      dist: {
        src: 'vendor/assets/stylesheets/ustyle/**/*.scss',
        output: 'dist/ustyle.json',
        dir: 'styleguide'
      }
    },
    cssstats: {
      dist: {
        src: 'dist/ustyle-latest.css',
        output: 'dist/stats.json'
      }
    },
    builder: {
      dist:{
        files: {
          'docs/': 'dist/ustyle.json',
          'docs/stats/': 'dist/stats.json'
        }
      }
    },
    sass: {
      dist: {
        options: {
          loadPath: ['vendor/assets/stylesheets/ustyle', 'styleguide/assets/sass'],
          require: './lib/ustyle.rb',
          style: 'compressed',
          sourcemap: 'none',
          bundleExec: true
        },
        files: {
          'dist/ustyle-latest.css': 'vendor/assets/stylesheets/ustyle.scss',
          'dist/ustyle-content.css': 'vendor/assets/stylesheets/ustyle-content.scss',
          'dist/ustyle-icons.css': 'vendor/assets/stylesheets/ustyle-icons.scss',
          'docs/css/main.css': 'styleguide/assets/sass/main.scss'
        }
      }
    },
    coffee: {
      compile: {
        files: {
          'dist/ustyle.js': [
            'vendor/assets/javascripts/ustyle/utils.js.coffee',
            'vendor/assets/javascripts/ustyle/anchor.js.coffee',
            'vendor/assets/javascripts/ustyle/tabs.js.coffee',
            'vendor/assets/javascripts/ustyle/overlay.js.coffee',
            'vendor/assets/javascripts/ustyle/classtoggler.js.coffee'
          ]
        }
      },
    },
    concat: {
      dist: {
        src: ['styleguide/assets/javascripts/vendor/*.js', 'dist/ustyle.js', 'styleguide/assets/javascripts/modules/*.js', 'styleguide/assets/javascripts/*.js'],
        dest: 'docs/js/app.js'
      }
    },
    copy: {
      main: {
        files: [
          {expand: true, flatten: true, src: ['styleguide/assets/images/**'], dest: 'docs/images/'},
        ]
      }
    },
    sassdoc: {
      default: {
        src: 'vendor/assets/stylesheets/ustyle/**/*.scss',
        options: {
          dest: './docs/sass'
        }
      }
    },
    scsslint: {
      allFiles: [
        './vendor/assets/stylesheets/**/*.scss',
      ],
      options: {
        bundleExec: true,
        config: 'config/scss-lint.yml',
        reporterOutput: null,
        exclude: [
          './vendor/assets/stylesheets/ustyle/vendor/*'
        ]
      }
    },
    env : {
      dev : {
        NODE_ENV : 'development'
      },
      build : {
        NODE_ENV : 'production'
      }
    },
    buildcontrol: {
      options: {
        dir: 'docs/',
        commit: true,
        push: true,
        message: 'Built %sourceName% from commit %sourceCommit% on branch %sourceBranch%'
      },
      pages: {
        options: {
          remote: 'git@github.com:uswitch/ustyle.git',
          branch: 'gh-pages'
        }
      }
    }
  });

  grunt.registerTask('lint', ['scsslint']);
  grunt.registerTask('icons', ['newer:svgmin', 'svg2png']);

  grunt.registerTask('build', ['sass', 'sassdoc', 'styleguide', 'copy', 'coffee', 'concat', 'lint', 'postcss', 'cssstats', 'builder']);

  grunt.registerTask('publish', ['env:build', 'build', 'buildcontrol:pages']);
  grunt.registerTask('publish:version', 'Build and publish ustyle version', function(version){
    if (version === null){
      grunt.warn('Version must be specified when publishing ustyle')
    }
    grunt.task.run('env:build', 'version::' + version, 'build', 'shell:publish', 'buildcontrol:pages');
  });

  grunt.registerTask('default', ['env:dev', 'build', 'browserSync-init', 'watch']);
};
