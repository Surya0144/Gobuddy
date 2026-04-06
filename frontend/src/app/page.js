'use client';

import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Pin, Trash2, XCircle, Send, User, MessageCircle } from 'lucide-react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/messages';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export default function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [joinName, setJoinName] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize Socket & Load Data
  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('chatUser');
    if (storedUser) {
      setTimeout(() => {
        setCurrentUser(JSON.parse(storedUser));
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Connect Socket
    const newSocket = io(SOCKET_URL, {
      withCredentials: true
    });

    // Initial Fetch
    fetch(`${API_URL}?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch(console.error);

    // Socket Event Listeners
    newSocket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    });

    newSocket.on('messageUpdated', (updatedMsg) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    });

    newSocket.on('messageDeleted', ({ id, target }) => {
      if (target === 'everyone') {
        setMessages(prev => prev.map(m => {
          if (m._id === id) {
            return { ...m, isDeletedForEveryone: true, text: 'This message was deleted.', isPinned: false };
          }
          return m;
        }));
      }
    });

    return () => newSocket.close();
  }, [currentUser]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinName.trim()) return;
    
    // Generate simple UUID-like ID
    const newUserId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const user = {
      id: newUserId,
      name: joinName.trim()
    };
    
    localStorage.setItem('chatUser', JSON.stringify(user));
    setCurrentUser(user);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const payload = {
      text: inputText,
      senderId: currentUser.id,
      username: currentUser.name
    };

    setInputText(''); // Optimistic clear

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send:', error);
    }
  };

  const togglePin = async (id) => {
    try {
      await fetch(`${API_URL}/${id}/pin`, { method: 'PATCH' });
    } catch (error) {
      console.error('Failed to pin:', error);
    }
  };

  const deleteMessage = async (id, target) => {
    try {
      await fetch(`${API_URL}/${id}?target=${target}&userId=${currentUser.id}`, { 
        method: 'DELETE' 
      });

      if (target === 'me') {
        // Optimistically remove from UI
        setMessages(prev => prev.filter(m => m._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className={styles.container}>
        <div className={styles.joinOverlay}>
          <form className={styles.joinCard} onSubmit={handleJoin}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)'}}>
              <MessageCircle size={48} />
            </div>
            <h1 className={styles.joinTitle}>Join Gobuddy Chat</h1>
            <p className={styles.joinSubtitle}>Enter a username to start messaging</p>
            <div className={styles.inputGroup}>
              <input
                type="text"
                maxLength={50}
                required
                className={styles.input}
                placeholder="Enter your name..."
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                autoFocus
              />
              <button type="submit" className={styles.btnPrimary}>
                Join Chat
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const pinnedMessages = messages.filter(m => m.isPinned && !m.isDeletedForEveryone && !m.deletedFor?.includes(currentUser.id));
  const activeMessages = messages.filter(m => !m.deletedFor?.includes(currentUser.id));

  // Helper to jump to a message
  const scrollToMessage = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className={styles.container}>
      {/* Pinned Messages Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}><Pin size={18} /> Pinned Messages</h2>
        </div>
        <div className={styles.pinnedList}>
          {pinnedMessages.length === 0 ? (
            <div className={styles.emptyPinned}>
              <Pin size={24} opacity={0.5} />
              <p>No pinned messages</p>
            </div>
          ) : (
            pinnedMessages.map(msg => (
              <div 
                key={`pin-${msg._id}`} 
                className={styles.pinnedMessage}
                onClick={() => scrollToMessage(msg._id)}
              >
                <div style={{fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--primary)'}}>{msg.username}</div>
                <div style={{opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{msg.text}</div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={styles.mainChat}>
        <header className={styles.chatHeader}>
          <div style={{fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <MessageCircle size={20} color="var(--primary)" />
            <span>Gobuddy</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <User size={16} />
            <span className={styles.currentUser}>{currentUser.name}</span>
          </div>
        </header>

        <div className={styles.messageArea}>
          {activeMessages.map(msg => {
            const isSelf = msg.senderId === currentUser.id;
            const isDeleted = msg.isDeletedForEveryone;

            return (
              <div 
                key={msg._id} 
                id={`msg-${msg._id}`}
                className={`${styles.messageWrapper} ${isSelf ? styles.messageSelf : styles.messageOther}`}
              >
                <div className={styles.messageSender}>{msg.username}</div>
                <div className={styles.messageBubble}>
                  {isDeleted ? (
                    <span className={styles.deletedMessage}>
                      <span style={{opacity: 0.7}}>This message was deleted for everyone</span>
                    </span>
                  ) : msg.text}
                  
                  <span className={styles.messageTime}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Actions (Only show if not deleted for everyone) */}
                  {!isDeleted && (
                    <div className={styles.messageActions}>
                      <button 
                        className={`${styles.actionBtn} ${msg.isPinned ? styles.activePin : ''}`} 
                        onClick={() => togglePin(msg._id)}
                        title={msg.isPinned ? "Unpin message" : "Pin message"}
                      >
                        <Pin size={16} />
                      </button>
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => deleteMessage(msg._id, 'me')}
                        title="Delete for me"
                      >
                        <XCircle size={16} />
                      </button>
                      {isSelf && (
                        <button 
                          className={`${styles.actionBtn} ${styles.danger}`} 
                          onClick={() => deleteMessage(msg._id, 'everyone')}
                          title="Delete for everyone"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <form className={styles.inputForm} onSubmit={sendMessage}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className={styles.messageInput}
              maxLength={2000}
            />
            <button 
              type="submit" 
              className={styles.sendBtn} 
              disabled={!inputText.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
