import './WalkieTalkie.css'
import { useState, useRef } from 'react';
import { MediaConnection, Peer } from 'peerjs';
import { useMount } from 'react-use';
import { SupabasePresenceState, UserStatus } from '../../types/index.ts';
import { supabase } from '../../supabase';
import WalkieTalkieKeypad from './WalkieTalkieKeypad.tsx';
import RoomCodeDisplay from './RoomCodeDisplay.tsx';
import { audioService } from '../services/audioService.ts';

const WalkieTalkie = () => {
  const [roomCode, setRoomCode] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [peersCount, setPeersCount] = useState<number>(0);
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const sbRtChannelRef = useRef<any>(null); //TODO PAU should be of type RealtimeChannel
  const callsRef = useRef<MediaConnection[]>([]);
  const remoteAudioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useMount(() => {
    if (!peerRef.current) {
      peerRef.current = new Peer();

      peerRef.current.on('open', (id: string) => {
        setPeerId(id);
      });

      peerRef.current.on('call', (call) => {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            streamRef.current = stream;
            call.answer(streamRef.current);
            call.on('stream', (remoteStream) => {
              playRemoteStream(remoteStream, call.peer);
            });
            callsRef.current.push(call);
            if (isTalking) {
              return;
            }
            callsRef.current.forEach(call => {
              const senders = call.peerConnection?.getSenders();
              if (!senders) {
                return;
              }
              const audioSender = senders.find((sender: any) => sender.track?.kind === 'audio');
              if (audioSender && audioSender.track) {
                audioSender.track.enabled = false;
              }
            });
          })
          .catch(err => console.error('Failed to get user media:', err));
      });
    }

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (callsRef.current) {
        callsRef.current.forEach(call => call.close());
        callsRef.current = [];
      }
    };
  });

  const joinRoom = () => {
    sbRtChannelRef.current = supabase.channel(`${roomCode}`);
    audioService.play('join');
    setIsConnected(true);
    
    const userStatus: UserStatus = {
      peer_id: peerId,
      online_at: new Date().toISOString()
    };

    sbRtChannelRef.current
    .on('presence', { event: 'sync' }, () => {
      const newState: SupabasePresenceState = sbRtChannelRef.current.presenceState()
      const newStateValues = Object.values(newState);
      const shouldConnect = newStateValues.some(presences => 
        presences.some(presence => presence.peer_id === peerId)
      );
      if (shouldConnect) {
        connectToPeers(newState);
        setPeersCount(newStateValues.length - 1);
      }
    })
    //TODO PAU use join and leave to remove peers after the initial sync to improve connection performance
    // .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
    //   console.log('join', key, newPresences)
    // })
    // .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
    //   console.log('leave', key, leftPresences)
    // })
    .subscribe(async (status: string) => {
      if (status !== 'SUBSCRIBED') { return }
      await sbRtChannelRef.current.track(userStatus)
    });
  };

  const connectToPeers = (newState: SupabasePresenceState) => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        streamRef.current = stream;
        Object.values(newState).forEach(presences => {
          presences.forEach(presence => {
            if (!peerRef.current || !stream || presence.peer_id === peerRef.current.id) {
              return;
            }
            const call = peerRef.current.call(presence.peer_id, streamRef.current as MediaStream);
            call.on('stream', (remoteStream) => {
              playRemoteStream(remoteStream, presence.peer_id);
            });
            callsRef.current.push(call);
            if (isTalking) {
              return;
            }
            callsRef.current.forEach(call => {
              const senders = call.peerConnection?.getSenders();
              if (!senders) {
                return;
              }
              const audioSender = senders.find((sender: any) => sender.track?.kind === 'audio');
              if (audioSender && audioSender.track) {
                audioSender.track.enabled = false;
              }
            });
          });
        });
      })
      .catch(err => console.error('Failed to get user media:', err));
  };

  const onStartTalking = async () => {
    if (!streamRef.current) {
      return;
    }
    setIsTalking(true);
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length <= 0) {
      return;
    }
    audioTracks[0].enabled = true;
    callsRef.current.forEach(call => { // Unmute all active calls tracks
      const senders = call.peerConnection?.getSenders();
      if (!senders) {
        return;
      }
      const audioSender = senders.find((sender: RTCRtpSender) => sender.track?.kind === 'audio');
      if (audioSender && audioSender.track) {
        audioSender.track.enabled = true;
      }
    });
  };

  const onStopTalking = () => {
    if (!streamRef.current) {
      return;
    }
    audioService.play('over');
    setIsTalking(false);
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length <= 0) {
      return;
    }
    audioTracks[0].enabled = false;
    callsRef.current.forEach(call => { // Mute all active calls tracks
      const senders = call.peerConnection?.getSenders();
      if (!senders) {
        return;
      }
      const audioSender = senders.find((sender: RTCRtpSender) => sender.track?.kind === 'audio');
      if (audioSender && audioSender.track) {
        audioSender.track.enabled = false;
      }
    });
  };

  const playRemoteStream = (remoteStream: MediaStream, peerId: string) => {
    const audio = new Audio();
    audio.srcObject = remoteStream;
    audio.play();
    remoteAudioRefs.current[peerId] = audio;
  };

  const onNewRadioFrequency = () => {
    audioService.play('leave');
    setIsConnected(false);
    setIsTalking(false);
    remoteAudioRefs.current = {};
    sbRtChannelRef.current?.unsubscribe();
    sbRtChannelRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (callsRef.current) {
      callsRef.current.forEach(call => call.close());
      callsRef.current = [];
    }
  };

  return (
    <div className="walkie-talkie">
      <div className="walkie-talkie-decorator-container">
        <span>W. Talkie®</span>
        <span>for Teton by Pau</span>
      </div>
      <RoomCodeDisplay roomCode={roomCode} isConnected={isConnected} peersCount={peersCount} />
      <div className="walkie-talkie-keypad-container">
        <WalkieTalkieKeypad
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
          maxLength={4}
          onReachedLength={joinRoom}
          onUndoReachedLength={onNewRadioFrequency}
        />
        <button
          disabled={!isConnected}
          className="push-to-talk-button"
          onMouseDown={onStartTalking}
          onMouseUp={onStopTalking}
          onPointerDown={onStartTalking}
          onPointerUp={onStopTalking}
        >
          {isTalking ? 'Release to stop' : 'Push to talk'}
        </button>
      </div>
    </div>
  );
};

export default WalkieTalkie; 