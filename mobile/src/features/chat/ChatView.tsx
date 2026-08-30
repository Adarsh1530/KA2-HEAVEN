import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { api, resolveMediaUrl } from '../../services/api';
import { socketService } from '../../services/socket';
import { notificationService } from '../../services/notifications';
import { VoiceRecorder } from './VoiceRecorder';
import { VoicePlayer } from './VoicePlayer';
import { Message, MessageReaction, SOCKET_EVENTS } from '@ka2/shared';
import {
  Send,
  Mic,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Phone,
  Video,
  Check,
  CheckCheck,
  Search,
  X,
  Reply,
  Trash2,
  Edit2,
  Copy,
  Heart,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';

export const ChatView: React.FC = () => {
  const { user, partner } = useAuth();
  const { startCall } = useCall();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // messageId for reactions

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  const fetchMessages = async (query = '') => {
    try {
      const endpoint = query ? `/chat/messages?search=${encodeURIComponent(query)}` : '/chat/messages';
      const data = await api.request(endpoint);
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const handleSync = () => fetchMessages();
    window.addEventListener('ka2_data_cleared', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ka2_data_cleared', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping]);

  // Realtime Socket Event Listeners
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.senderId !== user?.id) {
        const preview =
          msg.type === 'image'
            ? 'Sent a photo 📷'
            : msg.type === 'voice'
            ? 'Sent a voice note 🎙️'
            : msg.type === 'video'
            ? 'Sent a video 🎥'
            : (msg.content || 'New romantic message ❤️');
        notificationService.notifyNewMessage(partner?.name || 'My Love', preview);
      }
      scrollToBottom();
    };

    const handleEditMessage = (data: { message: Message }) => {
      setMessages(prev => prev.map(m => (m.id === data.message.id ? data.message : m)));
    };

    const handleDeleteMessage = (data: { messageId: string }) => {
      setMessages(prev => prev.map(m => (m.id === data.messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m)));
    };

    const handleReaction = (data: { messageId: string; reactions: MessageReaction[] }) => {
      setMessages(prev => prev.map(m => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m)));
    };

    const handleTypingStart = (data: { userId: string }) => {
      if (data.userId !== user?.id) {
        setPartnerTyping(true);
      }
    };

    const handleTypingStop = (data: { userId: string }) => {
      if (data.userId !== user?.id) {
        setPartnerTyping(false);
      }
    };

    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVE, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_EDIT, handleEditMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETE, handleDeleteMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_REACT, handleReaction);
    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_RECEIVE, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_EDIT, handleEditMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETE, handleDeleteMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_REACT, handleReaction);
      socket.off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
    };
  }, [user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    const socket = socketService.getSocket();
    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit(SOCKET_EVENTS.TYPING_START);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit(SOCKET_EVENTS.TYPING_STOP);
    }, 2000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !editingMessage) return;

    const content = inputText.trim();
    setInputText('');

    if (editingMessage) {
      try {
        const res = await api.request(`/chat/messages/${editingMessage.id}`, {
          method: 'PUT',
          body: JSON.stringify({ content }),
        });
        const socket = socketService.getSocket();
        socket?.emit(SOCKET_EVENTS.MESSAGE_EDIT, { message: res.message });
        setEditingMessage(null);
      } catch (err) {
        console.error('Failed to edit:', err);
      }
      return;
    }

    try {
      const payload = {
        content,
        type: 'text',
        replyToId: replyingTo?.id,
      };
      setReplyingTo(null);

      const res = await api.request('/chat/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const socket = socketService.getSocket();
      socket?.emit(SOCKET_EVENTS.MESSAGE_SEND, res.message);
    } catch (err) {
      console.error('Failed to send:', err);
    }
  };

  const handleSendVoice = async (audioBlob: Blob, durationMs: number, waveform: number[]) => {
    setIsRecordingVoice(false);
    try {
      const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      const uploadRes = await api.uploadMedia(audioFile);

      const payload = {
        content: 'Voice note',
        type: 'voice',
        mediaUrl: uploadRes.fileUrl,
        voiceMeta: {
          durationMs,
          waveform,
          fileSize: uploadRes.fileSize,
        }
      };

      const res = await api.request('/chat/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const socket = socketService.getSocket();
      socket?.emit(SOCKET_EVENTS.MESSAGE_SEND, res.message);
    } catch (err) {
      console.error('Failed to send voice note:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadRes = await api.uploadMedia(file);
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');

      const payload = {
        content: file.name,
        type: isImg ? 'image' : isVid ? 'video' : 'file',
        mediaUrl: uploadRes.fileUrl,
        mediaMeta: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }
      };

      const res = await api.request('/chat/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const socket = socketService.getSocket();
      socket?.emit(SOCKET_EVENTS.MESSAGE_SEND, res.message);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const res = await api.request(`/chat/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      const socket = socketService.getSocket();
      socket?.emit(SOCKET_EVENTS.MESSAGE_REACT, res);
      setShowEmojiPicker(null);
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await api.request(`/chat/messages/${messageId}`, { method: 'DELETE' });
      const socket = socketService.getSocket();
      socket?.emit(SOCKET_EVENTS.MESSAGE_DELETE, { messageId });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] relative overflow-hidden">
      {/* 1. Chat Top Header */}
      <div className="glass-panel border-b border-white/10 px-4 py-3 flex items-center justify-between z-10 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={resolveMediaUrl(partner?.avatarUrl, partner?.name || 'Anu')}
              alt={partner?.name}
              className="w-10 h-10 rounded-full object-cover border border-[#FF4F81]"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#07070C] ${
                partner?.presenceStatus === 'online' ? 'bg-[#42D392]' : 'bg-white/40'
              }`}
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">{partner?.name || 'Anu Sri'}</h2>
            <p className="text-[10px] text-[#A7A7B7]">
              {partnerTyping ? (
                <span className="text-[#FF91B5] font-medium flex items-center space-x-1">
                  <span>typing</span>
                  <span className="animate-pulse">...</span>
                </span>
              ) : partner?.presenceStatus === 'online' ? (
                <span className="text-[#42D392] font-medium">Active now</span>
              ) : (
                'Heaven Partner'
              )}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSearching(!isSearching)}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => startCall('voice')}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:text-[#42D392] transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => startCall('video')}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:text-[#9B5CFF] transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar (Collapsible) */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-panel border-b border-white/10 px-4 py-2 flex items-center space-x-2"
          >
            <Search className="w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search romantic messages..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchMessages(e.target.value);
              }}
              className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-white/40"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchMessages();
                }}
              >
                <X className="w-3.5 h-3.5 text-white/40" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Message History Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#9B5CFF]/20 to-[#FF4F81]/20 border border-[#FF4F81]/30 flex items-center justify-center mb-3 shadow-glow-pink">
              <Heart className="w-8 h-8 text-[#FF4F81] animate-heart-pulse" />
            </div>
            <h3 className="text-base font-semibold text-white">Your story starts here. ❤️</h3>
            <p className="text-xs text-[#A7A7B7] max-w-xs mt-1">
              Every thought, whisper, and secret shared here belongs only to the two of you.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOutgoing = msg.senderId === user?.id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} group`}
              >
                {/* Reply Bubble Quoted */}
                {msg.replyTo && (
                  <div className={`text-[10px] text-white/60 mb-1 px-3 py-1 rounded-xl bg-white/5 border border-white/5 max-w-[75%]`}>
                    <span className="font-semibold text-[#FF91B5]">
                      {msg.replyTo.senderId === user?.id ? 'You' : partner?.name}:
                    </span>{' '}
                    <span className="truncate">{msg.replyTo.content}</span>
                  </div>
                )}

                {/* Main Message Bubble */}
                <div className="relative group/bubble">
                  <div
                    className={`rounded-2xl px-4 py-2.5 max-w-[80vw] sm:max-w-md shadow-glass backdrop-blur-xl transition-all ${
                      isOutgoing
                        ? 'bg-bubble-outgoing text-white rounded-br-xs'
                        : 'glass-panel text-white/95 rounded-bl-xs border border-white/10'
                    }`}
                  >
                    {/* Media Type Handling */}
                    {msg.type === 'image' && msg.mediaUrl && (
                      <img
                        src={resolveMediaUrl(msg.mediaUrl)}
                        alt="attachment"
                        className="rounded-xl max-h-60 w-full object-cover mb-1.5 cursor-pointer hover:opacity-95"
                        onClick={() => window.open(resolveMediaUrl(msg.mediaUrl), '_blank')}
                      />
                    )}

                    {msg.type === 'video' && msg.mediaUrl && (
                      <video
                        src={resolveMediaUrl(msg.mediaUrl)}
                        controls
                        className="rounded-xl max-h-60 w-full object-cover mb-1.5"
                      />
                    )}

                    {msg.type === 'voice' && msg.mediaUrl && (
                      <VoicePlayer
                        src={resolveMediaUrl(msg.mediaUrl)}
                        durationMs={msg.voiceMeta?.durationMs}
                        waveform={msg.voiceMeta?.waveform}
                        isOutgoing={isOutgoing}
                      />
                    )}

                    {msg.type === 'text' && (
                      <p className={`text-sm leading-relaxed ${msg.isDeleted ? 'italic text-white/50 text-xs' : ''}`}>
                        {msg.content}
                      </p>
                    )}

                    {/* Timestamp & Status */}
                    <div className={`flex items-center justify-end space-x-1 mt-1 text-[9px] ${isOutgoing ? 'text-white/80' : 'text-[#A7A7B7]'}`}>
                      {msg.isEdited && <span className="italic mr-1">edited</span>}
                      <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                      {isOutgoing && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#FF91B5]" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-white/70" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-white/50" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Context Actions Pill on Hover */}
                  <div
                    className={`absolute -top-7 ${
                      isOutgoing ? 'right-0' : 'left-0'
                    } hidden group-hover/bubble:flex items-center space-x-1 bg-[#101019] border border-white/10 rounded-full px-2 py-1 shadow-lg z-20`}
                  >
                    <button
                      onClick={() => handleReact(msg.id, '❤️')}
                      className="text-xs hover:scale-125 transition-transform"
                      title="Heart"
                    >
                      ❤️
                    </button>
                    <button
                      onClick={() => handleReact(msg.id, '😍')}
                      className="text-xs hover:scale-125 transition-transform"
                      title="Love"
                    >
                      😍
                    </button>
                    <button
                      onClick={() => handleReact(msg.id, '✨')}
                      className="text-xs hover:scale-125 transition-transform"
                      title="Sparkle"
                    >
                      ✨
                    </button>
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="text-white/70 hover:text-white p-0.5"
                      title="Reply"
                    >
                      <Reply className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="text-white/70 hover:text-white p-0.5"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {isOutgoing && !msg.isDeleted && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMessage(msg);
                            setInputText(msg.content);
                          }}
                          className="text-white/70 hover:text-white p-0.5"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="text-[#FF5570] hover:text-[#FF5570]/80 p-0.5"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Reactions list pill */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex items-center space-x-1 -mt-2.5 z-10">
                    {msg.reactions.map((r, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-[#171722] border border-white/10 px-1.5 py-0.5 rounded-full shadow-md"
                      >
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}

        {/* Partner Typing Indicator (3 Gently Pulsing Particles) */}
        {partnerTyping && (
          <div className="flex items-center space-x-2 text-xs text-[#FF91B5] glass-panel px-3 py-1.5 rounded-full w-fit">
            <span>{partner?.nickname || 'Anu'} is typing</span>
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-[#FF4F81] rounded-full animate-pulse" />
              <span className="w-1.5 h-1.5 bg-[#FF91B5] rounded-full animate-pulse delay-100" />
              <span className="w-1.5 h-1.5 bg-[#9B5CFF] rounded-full animate-pulse delay-200" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input & Action Bar */}
      <div className="glass-panel border-t border-white/10 p-3 backdrop-blur-2xl">
        {/* Reply / Edit Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-white/5 border-l-2 border-[#FF4F81] px-3 py-1.5 rounded mb-2 text-xs">
            <div>
              <span className="text-[#FF91B5] font-semibold">Replying to:</span>{' '}
              <span className="text-white/80">{replyingTo.content}</span>
            </div>
            <button onClick={() => setReplyingTo(null)}>
              <X className="w-3.5 h-3.5 text-white/50" />
            </button>
          </div>
        )}

        {editingMessage && (
          <div className="flex items-center justify-between bg-white/5 border-l-2 border-[#9B5CFF] px-3 py-1.5 rounded mb-2 text-xs">
            <div>
              <span className="text-[#B28CFF] font-semibold">Editing message:</span>{' '}
              <span className="text-white/80">{editingMessage.content}</span>
            </div>
            <button onClick={() => { setEditingMessage(null); setInputText(''); }}>
              <X className="w-3.5 h-3.5 text-white/50" />
            </button>
          </div>
        )}

        {isRecordingVoice ? (
          <VoiceRecorder
            onSendVoice={handleSendVoice}
            onCancel={() => setIsRecordingVoice(false)}
          />
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            {/* Photo / Gallery Picker */}
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              title="Open Photo Gallery / Camera"
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#FF91B5] hover:bg-[#FF4F81]/20 hover:text-white transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Document / File Picker */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach File / Document"
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Message Input Field */}
            <input
              type="text"
              placeholder="Send a private message..."
              value={inputText}
              onChange={handleInputChange}
              className="flex-1 bg-[#101019]/90 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4F81] placeholder-white/30 backdrop-blur-md"
            />

            {/* Voice Record Toggle or Send Button */}
            {inputText.trim() || editingMessage ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-9 h-9 rounded-full bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white flex items-center justify-center shadow-glow-pink hover:opacity-95 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#FF91B5] hover:bg-[#FF4F81]/20 transition-colors"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
