import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const sampleReplies = (q: string): string => {
  const lower = q.toLowerCase();
  if (lower.includes('assignment')) return 'To submit an assignment, open Assignments → Submit Assignment next to the task.';
  if (lower.includes('course')) return 'Browse available courses under Courses. Enrollments are managed by your lecturer/admin.';
  if (lower.includes('upload')) return 'Use My Uploads to store personal files, or Submit Assignment for graded work.';
  return 'I can help with navigating SPY Elearning system. Try asking about assignments, courses, or uploads.';
};

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: 'Hi! I\'m your learning assistant. How can I help?' }
  ]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const user: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    const assistant: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: sampleReplies(trimmed) };
    setMessages((m) => [...m, user, assistant]);
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <Card className="w-80 mb-3 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">SPY Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 overflow-y-auto space-y-2 mb-3">
              {messages.map(m => (
                <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div className={`inline-block px-3 py-2 rounded-md text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ask about assignments, uploads..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              />
              <Button size="icon" onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Button size="lg" className="shadow-lg" onClick={() => setOpen(!open)}>
        <MessageSquare className="h-5 w-5 mr-2" />
        {open ? 'Close' : 'Chat'}
      </Button>
    </div>
  );
}


