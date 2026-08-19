import Ionicons from '@expo/vector-icons/Ionicons';
import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

function VideoItem({ source, isCurrentlyActive, onPlay, onPause }) {
  const player = useVideoPlayer(source, (p) => {
    p.muted = false;
    p.pause();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // 1. Notify parent when this player starts playing
  useEffect(() => {
    if (isPlaying) {
      onPlay();
    }
  }, [isPlaying, onPlay]);

  // 2. Force pause if another video becomes active
  useEffect(() => {
    if (!isCurrentlyActive && isPlaying) {
      player.pause();
    }
  }, [isCurrentlyActive, isPlaying, player]);

  // Listen for video finishing to allow replay and fix icon state
  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      player.seekBy(-player.currentTime); // Seek to beginning
      player.pause();
      onPause(); // Reset active index in parent
    });
    return () => subscription.remove();
  }, [player, onPause]);

  return (
    <View style={styles.videoCard}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={true}
      />
      {/* Overlay play button when not playing */}
      {!isPlaying && (
        <Pressable
      onPress={() => {
      onPlay();
      player.play();
       }}
      style={styles.overlay}
  android_disableSound={true} // optional but cleaner UX
>
          <Ionicons
            name="play-circle"
            size={42}
            color="rgba(255,255,255,0.85)"
          />
        </Pressable>
      )}
    </View>
  );
}

export default function VideoCarousel() {
  const [activeIndex, setActiveIndex] = useState(null);

  const sources = [
    require('../../assets/videos/kd.mp4'),
    require('../../assets/videos/meena.mp4'),
    require('../../assets/videos/naushin.mp4'),
    require('../../assets/videos/suraj.mp4'),
  ];

  return (
    <View style={{ marginTop: 14, marginBottom: 14 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {sources.map((src, idx) => (
          <VideoItem
            key={idx}
            source={src}
            isCurrentlyActive={activeIndex === idx}
            onPlay={() => setActiveIndex(idx)}
            onPause={() => setActiveIndex(null)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  videoCard: {
    width: 200,
    height: 150,
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)', // Add a slight dimming to make the icon more visible
  },
});
