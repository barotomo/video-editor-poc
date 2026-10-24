import sys
from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(video_id):
    try:
        ytt_api = YouTubeTranscriptApi()
        # 日本語(ja)字幕を優先して取得
        fetched_transcript = ytt_api.fetch(video_id, languages=['ja'])
        
        # テキスト部分のみを抽出して1つの文章に結合
        text = " ".join([snippet.text for snippet in fetched_transcript])
        print(text)
    except Exception as e:
        print(f"字幕の取得に失敗しました: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        url = sys.argv[1]
        if "v=" in url:
            video_id = url.split("v=")[1].split("&")[0]
        elif "youtu.be/" in url:
            video_id = url.split("youtu.be/")[1].split("?")[0]
        else:
            video_id = url
        get_transcript(video_id)
    else:
        print("URLを指定してください")