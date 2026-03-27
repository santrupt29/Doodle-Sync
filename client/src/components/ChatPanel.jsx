import { useState, useEffect, useRef } from 'react';

export default function ChatPanel({ messages, sendGuess, isDrawer, myPlayerId, drawStartedAt, drawerName }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendGuess(input, drawStartedAt);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // Filter messages: CLOSE messages only visible to the sender
  const visibleMessages = messages.filter(m => {
    if (m.type === 'CLOSE') {
      return m.playerId === myPlayerId;
    }
    return true;
  });

  const getMessageStyle = (type) => {
    switch (type) {
      case 'CORRECT':
        return { background: '#bef264', color: '#000', fontWeight: 700 };
      case 'CLOSE':
        return { background: '#fef08a', color: '#000', fontWeight: 500 };
      case 'SYSTEM':
        return { background: '#d4d4d4', color: '#000', fontWeight: 400, fontStyle: 'italic' };
      default:
        return { background: 'transparent', color: '#000', fontWeight: 400 };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* System message: who is drawing */}
      {drawerName && (
        <div className="px-3 py-2" style={{ background: '#d4d4d4' }}>
          <span className="text-sm font-bold text-green-700">
            {drawerName} is drawing now!
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 min-h-0">
        {visibleMessages.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-6 font-semibold">
            No messages yet...
          </div>
        )}
        {visibleMessages.map((m, i) => {
          const style = getMessageStyle(m.type);
          return (
            <div
              key={i}
              className="px-2 py-1 text-sm"
              style={style}
            >
              {m.type === 'CORRECT' ? (
                <span>{m.message}</span>
              ) : (
                <>
                  <span className="font-bold">{m.username}: </span>
                  <span>{m.message}</span>
                </>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {isDrawer ? (
        <div className="px-3 py-3 border-t-2 border-black text-center bg-gray-50">
          <span className="text-xs text-gray-500 font-bold italic">
            ✏️ You are drawing — no guessing!
          </span>
        </div>
      ) : (
        <div className="border-t-2 border-black">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your guess here..."
            autoFocus
            className="w-full px-3 py-3 bg-white text-sm text-black placeholder:text-gray-400 focus:outline-none border-0"
          />
        </div>
      )}
    </div>
  );
}