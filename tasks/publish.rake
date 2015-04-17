lib_path = File.join(File.dirname(__FILE__), 'lib')
$:.unshift(lib_path) unless $:.include?(lib_path)

require 'botoenv'
Botoenv.load

require 'ustyle'
require 'ustyle/deploy'
require 'fileutils'

namespace :ustyle do
  desc "Publishes uStyle v#{Ustyle::VERSION}"
  task :publish => [ "git:push",
                     "build:images",
                     "deploy:images", "deploy:stylesheets"
                    ] do
    puts green("Publishing uStyle v#{Ustyle::VERSION}")
  end
end

namespace :git do
  desc "Push version #{Ustyle::VERSION} to github"
  task :push do
    `git push && git push --tags`
  end
end

namespace :build do
  desc "Building images and hashing them"
  task :images do
    images_dir = File.join Ustyle.assets_path, "images"
    FileUtils.rm_r "build/images", force: true
    FileUtils.cp_r images_dir, "build"
    
    Dir["build/images/**/*"].each do |file|
      next if File.directory?(file)
      FileUtils.mv file, Ustyle.asset_digest(file), force: true
    end
  end
end

namespace :deploy do
  desc "Deploy stylesheets to S3"
  task :stylesheets do
    Dir["build/*.{css,json,js}"].each do |file|
      file_name = File.basename(file)
      content_type = Ustyle.mime_type_for(file_name)
      Ustyle.s3_upload( Ustyle.versioned_path(file_name), file, content_type )
      Ustyle.s3_upload( "ustyle/#{file_name}", file, content_type )
    end

    Ustyle.invalidate([
      "/s3/#{Ustyle::BUCKET}/ustyle/ustyle-latest.css",
      "/s3/#{Ustyle::BUCKET}/ustyle/ustyle-content.css",
      "/s3/#{Ustyle::BUCKET}/ustyle/ustyle-icons.css"
    ])
  end

  desc "Deploy images to S3"
  task :images do
    Dir["build/images/**/*"].each do |file|
      next if File.directory?(file)
      file_path = file.gsub(/^build\//, "")
      Ustyle.s3_upload( Ustyle.versioned_path(file_path), file, Ustyle.mime_type_for(file))
    end
  end
end

def colorize(text, color_code)
  "\e[#{color_code}m#{text}\e[0m"
end

def red(text); colorize(text, 31); end
def green(text); colorize(text, 32); end
