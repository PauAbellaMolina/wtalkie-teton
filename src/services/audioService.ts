import joinAudio from '../assets/audio/join.mp3';
import leaveAudio from '../assets/audio/leave.mp3';
import overAudio from '../assets/audio/over.mp3';

export const audioService = {
  play: (audio: string) => {
    const audioFiles: { [key: string]: string } = {
      join: joinAudio,
      leave: leaveAudio,
      over: overAudio
    };
    
    const audioElement = new Audio(audioFiles[audio]);
    audioElement.play();
  }
};