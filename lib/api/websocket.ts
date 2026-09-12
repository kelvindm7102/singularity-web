import { Client } from '@stomp/stompjs';
import { resolveApiBase } from './client';

class WebSocketService {
  private client: Client | null = null;
  private currentRoomId: string | null = null;
  private messageHandlers: Set<(event: any) => void> = new Set();
  
  public connect(roomId: string) {
    if (this.client && this.currentRoomId === roomId) {
      return; // Already connected to this room
    }

    if (this.client) {
      this.disconnect();
    }

    this.currentRoomId = roomId;

    const brokerURL = resolveApiBase().replace(/^http/, 'ws') + '/ws';

    this.client = new Client({
      brokerURL: brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log(`Connected to WebSocket for room ${roomId}`);
        this.client?.subscribe(`/topic/room/${roomId}`, (message) => {
          try {
            const event = JSON.parse(message.body);
            this.messageHandlers.forEach(handler => handler(event));
          } catch (e) {
            console.error('Failed to parse websocket message', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
      onWebSocketClose: () => {
        console.log('WebSocket connection closed');
      }
    });

    this.client.activate();
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.currentRoomId = null;
    }
  }

  public subscribeToRoomEvents(handler: (event: any) => void) {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }
}

export const wsService = new WebSocketService();
