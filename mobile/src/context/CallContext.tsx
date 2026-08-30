import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import { notificationService } from '../services/notifications';
import { useAuth } from './AuthContext';
import { CallType, CallStatus, SOCKET_EVENTS } from '@ka2/shared';

const generateCallId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

interface CallContextType {
  callState: CallStatus | 'idle';
  callType: CallType;
  callId: string | null;
  callerInfo: { id: string; name: string; avatar: string } | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isRecording: boolean;
  recordingConsentRequested: boolean;
  callDuration: number;
  connectionQuality: 'Excellent' | 'Good' | 'Poor' | 'Reconnecting';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: (reason?: string) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  requestRecording: () => void;
  respondRecordingConsent: (agreed: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

// Robust global default ICE servers with STUN + free open TURN relays for worldwide NAT traversal
const DEFAULT_ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turns:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, partner } = useAuth();
  const [callState, setCallState] = useState<CallStatus | 'idle'>('idle');
  const [callType, setCallType] = useState<CallType>('voice');
  const [callId, setCallId] = useState<string | null>(null);
  const [callerInfo, setCallerInfo] = useState<{ id: string; name: string; avatar: string } | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingConsentRequested, setRecordingConsentRequested] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'Excellent' | 'Good' | 'Poor' | 'Reconnecting'>('Excellent');

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const durationTimerRef = useRef<any>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const iceConfigRef = useRef<RTCConfiguration>(DEFAULT_ICE_SERVERS);

  // Fetch dynamic ICE servers on start / user login
  useEffect(() => {
    const fetchIce = async () => {
      try {
        const data = await api.request('/calls/ice-servers');
        if (data?.iceServers && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          iceConfigRef.current = {
            iceServers: data.iceServers,
            iceCandidatePoolSize: 10,
          };
          console.log('[WebRTC] Loaded dynamic ICE servers from backend');
        }
      } catch (e) {
        console.log('[WebRTC] Using global default STUN/TURN fallback servers');
      }
    };
    if (user) {
      fetchIce();
    }
  }, [user]);

  // Clean up streams & peer connection
  const cleanupCall = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    notificationService.stopCallRingtone();

    setRemoteStream(null);
    setCallState('idle');
    setCallId(null);
    setCallerInfo(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsRecording(false);
    setRecordingConsentRequested(false);
    setCallDuration(0);
  }, [localStream]);

  // Setup PeerConnection with global STUN + TURN
  const createPeerConnection = useCallback((type: CallType, cId: string, targetId: string) => {
    const pc = new RTCPeerConnection(iceConfigRef.current);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = socketService.getSocket();
        socket?.emit(SOCKET_EVENTS.CALL_SIGNAL_ICE, {
          callId: cId,
          targetUserId: targetId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state changed:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected') {
        setConnectionQuality('Reconnecting');
      } else if (pc.iceConnectionState === 'failed') {
        setConnectionQuality('Poor');
        if (typeof (pc as any).restartIce === 'function') {
          (pc as any).restartIce();
        }
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionQuality('Excellent');
      } else if (pc.iceConnectionState === 'checking') {
        setConnectionQuality('Good');
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else if (event.track) {
        const inboundStream = new MediaStream([event.track]);
        setRemoteStream(inboundStream);
      }
    };

    return pc;
  }, []);

  // Listen to incoming socket call events
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !user) return;

    const handleIncomingCall = (data: any) => {
      setCallId(data.callId);
      setCallType(data.callType);
      setCallerInfo({
        id: data.callerId,
        name: data.callerName,
        avatar: data.callerAvatar,
      });
      setCallState('ringing');
      notificationService.notifyIncomingCall(
        data.callerName || partner?.name || 'My Love',
        data.callType || 'voice',
        data.callId
      );
    };

    const handleCallAccept = async (data: any) => {
      notificationService.stopCallRingtone();
      setCallState('connected');
      callStartTimeRef.current = Date.now();
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Create WebRTC Offer
      const pc = peerConnectionRef.current;
      if (pc && partner) {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callType === 'video',
          });
          await pc.setLocalDescription(offer);
          socket.emit(SOCKET_EVENTS.CALL_SIGNAL_OFFER, {
            callId: data.callId,
            targetUserId: partner.id,
            sdp: offer,
          });
        } catch (e) {
          console.error('[WebRTC] Error creating offer:', e);
        }
      }
    };

    const handleCallReject = () => {
      cleanupCall();
    };

    const handleCallEnd = () => {
      cleanupCall();
    };

    const handleSignalOffer = async (data: any) => {
      try {
        if (!peerConnectionRef.current && partner) {
          createPeerConnection(callType, data.callId, partner.id);
        }
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit(SOCKET_EVENTS.CALL_SIGNAL_ANSWER, {
            callId: data.callId,
            targetUserId: data.senderId,
            sdp: answer,
          });
        }
      } catch (err) {
        console.error('[WebRTC] Error handling signal offer:', err);
      }
    };

    const handleSignalAnswer = async (data: any) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
      } catch (err) {
        console.error('[WebRTC] Error handling signal answer:', err);
      }
    };

    const handleSignalIce = async (data: any) => {
      const pc = peerConnectionRef.current;
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.warn('[WebRTC] Error adding ice candidate:', e);
        }
      }
    };

    const handleRecordingRequest = () => {
      setRecordingConsentRequested(true);
    };

    const handleRecordingConsent = (data: any) => {
      setIsRecording(Boolean(data.agreed));
    };

    socket.on(SOCKET_EVENTS.CALL_INCOMING, handleIncomingCall);
    socket.on(SOCKET_EVENTS.CALL_ACCEPT, handleCallAccept);
    socket.on(SOCKET_EVENTS.CALL_REJECT, handleCallReject);
    socket.on(SOCKET_EVENTS.CALL_END, handleCallEnd);
    socket.on(SOCKET_EVENTS.CALL_SIGNAL_OFFER, handleSignalOffer);
    socket.on(SOCKET_EVENTS.CALL_SIGNAL_ANSWER, handleSignalAnswer);
    socket.on(SOCKET_EVENTS.CALL_SIGNAL_ICE, handleSignalIce);
    socket.on(SOCKET_EVENTS.CALL_RECORDING_REQUEST, handleRecordingRequest);
    socket.on(SOCKET_EVENTS.CALL_RECORDING_CONSENT, handleRecordingConsent);

    return () => {
      socket.off(SOCKET_EVENTS.CALL_INCOMING, handleIncomingCall);
      socket.off(SOCKET_EVENTS.CALL_ACCEPT, handleCallAccept);
      socket.off(SOCKET_EVENTS.CALL_REJECT, handleCallReject);
      socket.off(SOCKET_EVENTS.CALL_END, handleCallEnd);
      socket.off(SOCKET_EVENTS.CALL_SIGNAL_OFFER, handleSignalOffer);
      socket.off(SOCKET_EVENTS.CALL_SIGNAL_ANSWER, handleSignalAnswer);
      socket.off(SOCKET_EVENTS.CALL_SIGNAL_ICE, handleSignalIce);
      socket.off(SOCKET_EVENTS.CALL_RECORDING_REQUEST, handleRecordingRequest);
      socket.off(SOCKET_EVENTS.CALL_RECORDING_CONSENT, handleRecordingConsent);
    };
  }, [user, partner, callType, createPeerConnection, cleanupCall]);

  const createMediaStreamSafe = async (type: CallType): Promise<MediaStream> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        return await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: type === 'video' ? {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          } : false,
        });
      }
    } catch (e) {
      console.warn('Hardware media stream unavailable, using safe virtual stream:', e);
    }

    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        osc.connect(dst);
        osc.start();
        const audioTrack = dst.stream.getAudioTracks()[0];

        if (type === 'video') {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const cCtx = canvas.getContext('2d');
          if (cCtx) {
            cCtx.fillStyle = '#101019';
            cCtx.fillRect(0, 0, 640, 480);
          }
          const videoStream = (canvas as any).captureStream ? (canvas as any).captureStream(15) : null;
          const videoTrack = videoStream ? videoStream.getVideoTracks()[0] : null;
          return new MediaStream(videoTrack ? [audioTrack, videoTrack] : [audioTrack]);
        }
        return new MediaStream([audioTrack]);
      }
    } catch {
      // Silent fallback
    }
    return new MediaStream();
  };

  const startCall = async (type: CallType) => {
    if (!partner || !user) return;

    try {
      const stream = await createMediaStreamSafe(type);
      setLocalStream(stream);

      const newCallId = generateCallId();
      setCallId(newCallId);
      setCallType(type);
      setCallState('initiated');
      setCallerInfo({
        id: partner.id,
        name: partner.name,
        avatar: partner.avatarUrl,
      });

      const pc = createPeerConnection(type, newCallId, partner.id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const socket = socketService.getSocket();
      socket?.emit(SOCKET_EVENTS.CALL_INITIATE, {
        callId: newCallId,
        callType: type,
        receiverId: partner.id,
      });
    } catch (err) {
      console.error('Failed to initialize call:', err);
    }
  };

  const acceptCall = async () => {
    if (!partner || !callId) return;

    try {
      const stream = await createMediaStreamSafe(callType);
      setLocalStream(stream);

      const pc = createPeerConnection(callType, callId, callerInfo?.id || partner.id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      setCallState('connected');
      callStartTimeRef.current = Date.now();
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      const socket = socketService.getSocket();
      socket?.emit(SOCKET_EVENTS.CALL_ACCEPT, {
        callId,
        callerId: callerInfo?.id || partner.id,
      });
    } catch (err) {
      console.error('Failed to accept call:', err);
      rejectCall();
    }
  };

  const rejectCall = (reason = 'declined') => {
    if (callId && (callerInfo || partner)) {
      const socket = socketService.getSocket();
      socket?.emit(SOCKET_EVENTS.CALL_REJECT, {
        callId,
        callerId: callerInfo?.id || partner?.id,
        reason,
      });
    }
    cleanupCall();
  };

  const endCall = async () => {
    if (callId && partner) {
      const duration = callDuration;
      const socket = socketService.getSocket();
      socket?.emit(SOCKET_EVENTS.CALL_END, {
        callId,
        targetUserId: partner.id,
        durationSeconds: duration,
      });

      try {
        await api.request('/calls/log', {
          method: 'POST',
          body: JSON.stringify({
            receiverId: partner.id,
            callType,
            status: 'completed',
            durationSeconds: duration,
            isRecorded: isRecording,
          }),
        });
      } catch {}
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const requestRecording = () => {
    if (callId && partner) {
      const socket = socketService.getSocket();
      socket?.emit(SOCKET_EVENTS.CALL_RECORDING_REQUEST, {
        callId,
        targetUserId: partner.id,
      });
    }
  };

  const respondRecordingConsent = (agreed: boolean) => {
    setRecordingConsentRequested(false);
    if (callId && partner) {
      setIsRecording(agreed);
      const socket = socketService.getSocket();
      socket?.emit(SOCKET_EVENTS.CALL_RECORDING_CONSENT, {
        callId,
        targetUserId: partner.id,
        agreed,
      });
    }
  };

  return (
    <CallContext.Provider value={{
      callState,
      callType,
      callId,
      callerInfo,
      isMuted,
      isVideoOff,
      isSpeakerOn,
      isRecording,
      recordingConsentRequested,
      callDuration,
      connectionQuality,
      localStream,
      remoteStream,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMute,
      toggleVideo,
      toggleSpeaker,
      requestRecording,
      respondRecordingConsent,
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};
