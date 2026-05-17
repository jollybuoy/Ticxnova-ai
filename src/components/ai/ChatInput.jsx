import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';

export function ChatInput({ onSend, loading }) {
  const [value, setValue] = useState('');

  const submit = () => {
    if (!value.trim() || loading) return;
    onSend(value);
    setValue('');
  };

  return (
    <div className="glass-card p-3">
      <div className="flex items-end gap-3">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Ask Ticxnova-AI about an IT issue..."
          disabled={loading}
          className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-zinc-600 disabled:opacity-60"
        />
        <Button onClick={submit} loading={loading} disabled={loading || !value.trim()}>
          <Send size={16} />
          Send
        </Button>
      </div>
      <p className="mt-2 px-2 text-[11px] text-zinc-600">
        Press Enter to send. Shift + Enter for a new line.
      </p>
    </div>
  );
}
