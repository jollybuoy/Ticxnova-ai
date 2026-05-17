import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { fetchOpenTicketCount } from '../lib/tickets/ticketService';

export function useOpenTicketCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setCount(0);
      return;
    }

    let mounted = true;
    fetchOpenTicketCount(user.id).then(({ count: openCount }) => {
      if (mounted) setCount(openCount);
    });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return count;
}
