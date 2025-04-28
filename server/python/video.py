print("Importing sys...")
import sys
print("sys imported ✅")

print("Importing os...")
import os
print("os imported ✅")

print("Importing random...")
import random
print("random imported ✅")

print("Importing subprocess...")
import subprocess
print("subprocess imported ✅")

print("Importing re...")
import re
print("re imported ✅")

print("Importing yt_dlp...")
import yt_dlp
print("yt_dlp imported ✅")

if len(sys.argv) < 4:
  print("Not enough arguments")
  sys.exit(1)
    
link = sys.argv[1]
start_time = sys.argv[2]
end_time = sys.argv[3]
video_name = sys.argv[4]

def clean_temp_directory(temp_path="temp"):
    if os.path.exists(temp_path) and os.path.isdir(temp_path):
        for file_name in os.listdir(temp_path):
            file_path = os.path.join(temp_path, file_name)
            if os.path.isfile(file_path): 
                os.remove(file_path)

progress_data = {"status": "idle", "progress": 0.0} 
def progress_hook(d):
    global progress_data
    if d['status'] == 'downloading':
        progress_data["status"] = "downloading"
        percent_str = d.get('_percent_str', '0%').strip()
        match = re.search(r'(\d+\.\d+)%', percent_str)
        if match:
            progress_data["progress"] = float(match.group(1)) 
        else:
            progress_data["progress"] = 0.0
        # print(progress_data["progress"])

        
    elif d['status'] == 'finished':
        progress_data["status"] = "finished"
        progress_data["progress"] = "100%"
        # print(progress_data["progress"])
        
def download_yt_video(video_url, name):
    download_dir = "./temp"
    os.makedirs(download_dir, exist_ok=True)
    ydl_opts = {
        'format': 'bestvideo+bestaudio/best',
        'outtmpl': f"{download_dir}/{name}",
        'merge_output_format': 'mp4',
        'noplaylist': True,
        'progress_hooks': [progress_hook],
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([video_url])

def is_valid_timestamp(ts):
    return ts.count(':') == 1 and all(part.isdigit() for part in ts.split(':'))

def main():
    print("MAIN")
    clean_temp_directory()
    # video_temp = "full-" + video_name
    video_path = "./temp/" + video_name
    
    # Download and clip the video
    # Change to video_temp in order to enable post processing (trimming)
    download_yt_video(link, video_name)
  
    # def trim_video(video_path, output_path, start_time, end_time):
    #     command = [
    #         'ffmpeg',
    #         '-ss', start_time,
    #         '-to', end_time,
    #         '-i', video_path,
    #         '-vcodec', 'copy',
    #         '-acodec', 'copy',
    #         '-avoid_negative_ts', 'make_zero',
    #         output_path
    #     ]
    #     try:
    #         subprocess.run(command, check=True)
    #     except subprocess.CalledProcessError as e:
    #         print(f'Error trimming video: {e}')
    
    # format_option = 0
    # # format option 0 -> Skip trimming (option 2 is best for trimming)
    
    # # Cut -> Exact timing -> Shows black screen till first keyframe
    # if format_option == 1:
    #   os.system(f"ffmpeg -i {video_path} -ss {start_time} -to {end_time} -c copy ./temp/{video_name}")
    
    # # Backtrack (Recommended) -> Inexact timing | Quick
    # elif format_option == 2:
    #   trim_video(video_path, "./temp/" + video_name, start_time, end_time)
    
    # # Re-encode -> Exact timing -> Slow
    # elif format_option == 3:
    #   os.system(f'ffmpeg -i {video_path} -ss {start_time} -to {end_time} -c:v libx264 -preset ultrafast -c:a copy ./temp/{video_name}')
    
    # clean_temp_directory()
    
if __name__ == "__main__":
    main()