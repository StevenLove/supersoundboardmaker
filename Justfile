#Justfile

default:
    @just --list

# Download a video from youtube 
# Example usage: 
# just dl "https://www.youtube.com/watch?v=NufNeERkm-8&list=PLRbCtOwj17CXQnQHyL5KZwaXQKmYQN5zz&index=2"
# just dl "https://www.youtube.com/watch?v=kVsbLANZVXU"
# Make sure you add double quotes around the URL! Otherwise zsh can't parse it correctly.
# if optional_start is provided
dl ARG:
    yt-dlp {{ARG}} -P "./sfx" -x --audio-format mp3
    echo "Remember you still need to just updateSoundBank to normalize the audio and update the soundBank.json!"


# convert mp4 to mp3
# this requires you put the path to the mp4 file in double quotes AND escape all the spaces in the path...

truncate PATH START END:
    ffmpeg -i {{PATH}} -ss {{START}} -to {{END}} -c copy {{PATH}}.truncated.mp3

# Example usage:
# truncate the first 22 seconds off the file
# just truncate-beginning "./assets/songs/estas\ tonne\ troubador.mp3" 00:00:22
truncate-beginning PATH SECONDS:
    ffmpeg -i {{PATH}} -ss {{SECONDS}} -c copy {{PATH}}.truncated.mp3

updateSoundBank:
    just normalize sfx
    rm -rf ./expo-app/assets/generated/sfx
    mkdir -p ./expo-app/assets/generated/sfx
    mv normalized/* ./expo-app/assets/generated/sfx
    rm -rf normalized
    node ./expo-app/scripts/update-soundBank-json.js

normalize DIRECTORY:
    mkdir -p normalized
    find sfx -type f \( -name '*.mp3' -o -name '*.wav' \) -exec bash -c ' \
    file="$0"; \
    output_dir="normalized/${file#{{DIRECTORY}}/}"; \
    mkdir -p "$(dirname "$output_dir")"; \
    ffmpeg -y -i "$file" -af "\
        loudnorm=I=-10:TP=-1.5:LRA=11, \
        acompressor=threshold=-20dB:ratio=2:attack=50:release=200, \
        silenceremove=start_periods=1:start_silence=0:start_threshold=-50dB, \
        volume=2.0 \
    " \
        "$output_dir"; \
    echo "$output_dir"; \
    ' {} \;

gh-pages:
    cd expo-app
    npx expo export -p web
    cd ..
    npx gh-pages -t -d expo-app/dist