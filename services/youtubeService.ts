// Using a public Invidious instance as a proxy to YouTube.
// Note: These instances can be unreliable and may change.
const API_BASE = 'https://invidious.protokolla.fi';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  videoThumbnails: { quality: string; url: string; width: number; height: number }[];
}

export const searchVideos = async (query: string): Promise<YouTubeVideo[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/v1/search?type=video&q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Invidious API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data as YouTubeVideo[];
  } catch (error) {
    console.error("Error searching YouTube:", error);
    throw error;
  }
};

const getAudioStream = async (videoId: string): Promise<{ url: string; mimeType: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/v1/videos/${videoId}`);
    if (!response.ok) {
      throw new Error(`Invidious API error fetching video info: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Prioritize audio-only formats if available
    const audioStream = data.adaptiveFormats?.find(
        (f: any) => f.type.startsWith('audio/mp4')
    );

    if (audioStream) {
        return { url: audioStream.url, mimeType: audioStream.type.split(';')[0] };
    }
    
    // Fallback to the first available format if no ideal one is found
    const fallbackStream = data.formatStreams?.[0] || data.adaptiveFormats?.[0];
    if(fallbackStream) {
         return { url: fallbackStream.url, mimeType: fallbackStream.type.split(';')[0] || 'audio/mpeg' };
    }

    throw new Error('No suitable audio stream found for this video.');

  } catch (error) {
    console.error(`Error getting audio stream for ${videoId}:`, error);
    throw error;
  }
};

export const downloadAudio = async (video: YouTubeVideo): Promise<File> => {
    try {
        const { url, mimeType } = await getAudioStream(video.videoId);
        
        const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

        const audioResponse = await fetch(fullUrl);
        if (!audioResponse.ok) {
            throw new Error(`Failed to download audio file: ${audioResponse.statusText}`);
        }
        const audioBlob = await audioResponse.blob();

        // Sanitize title for use as a filename
        const fileName = `${video.title.replace(/[/\\?%*:|"<>]/g, '-')}.mp3`;

        return new File([audioBlob], fileName, { type: mimeType });

    } catch (error) {
        console.error(`Download failed for ${video.title}:`, error);
        throw error;
    }
};