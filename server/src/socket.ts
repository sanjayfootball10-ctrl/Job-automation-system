import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`⚡ [Realtime] Client connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join', (userId: number | string) => {
      const room = `user_${userId}`;
      socket.join(room);
      console.log(`👤 [Realtime] Socket ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`⚡ [Realtime] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToUser(userId: number | string, event: string, payload: any) {
  if (io) {
    io.to(`user_${userId}`).emit(event, payload);
  }
}

export function emitGlobal(event: string, payload: any) {
  if (io) {
    io.emit(event, payload);
  }
}
