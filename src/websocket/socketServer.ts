import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { ChatService } from '../services/chatService';
import { CallService } from '../services/callService';
import { NotificationService } from '../services/notificationService';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  user?: any;
}

export class SocketServer {
  private io: SocketIOServer;
  private chatService: ChatService;
  private callService: CallService;
  private notificationService: NotificationService;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private callCallerMap: Map<string, string> = new Map(); // callId -> callerId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.chatService = new ChatService();
    this.callService = new CallService();
    this.notificationService = new NotificationService();

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.userId).select('_id name email role');

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.user = user;

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      // Simple rate limiting - can be enhanced with Redis
      const now = Date.now();
      const lastMessage = (socket as any).lastMessage || 0;

      if (now - lastMessage < 100) { // 100ms between messages
        return next(new Error('Rate limit exceeded'));
      }

      (socket as any).lastMessage = now;
      next();
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`);

      // Store connected user
      this.connectedUsers.set(socket.userId!, socket.id);

      // Join user to their personal room
      socket.join(`user:${socket.userId}`);

      // Join user to role-based rooms
      socket.join(`role:${socket.userRole}`);

      // Handle chat events
      this.setupChatEvents(socket);

      // Handle call events
      this.setupCallEvents(socket);

      // Handle presence events
      this.setupPresenceEvents(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        this.connectedUsers.delete(socket.userId!);

        // Notify others about user going offline
        socket.broadcast.emit('presence:offline', {
          userId: socket.userId,
          timestamp: new Date()
        });
      });
    });
  }

  private setupChatEvents(socket: AuthenticatedSocket) {
    // Join conversation room
    socket.on('chat:join', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;

        // Verify user has access to conversation
        const conversation = await this.chatService.getConversationById(conversationId, socket.userId!);
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found or access denied' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        socket.emit('chat:joined', { conversationId });

        // Notify others in conversation
        socket.to(`conversation:${conversationId}`).emit('chat:user_joined', {
          conversationId,
          userId: socket.userId,
          userName: socket.user.name
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Leave conversation room
    socket.on('chat:leave', (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      socket.emit('chat:left', { conversationId });
    });

    // Send message
    socket.on('chat:message', async (data: {
      conversationId: string;
      content: string;
      type: 'text' | 'image' | 'file' | 'audio';
      replyTo?: string;
      attachmentMeta?: any;
    }) => {
      try {
        const message = await this.chatService.sendMessage(
          data.conversationId,
          socket.userId!,
          {
            content: data.content,
            type: data.type,
            replyTo: data.replyTo,
            attachmentMeta: data.attachmentMeta
          } as any
        );

        // Broadcast message to conversation room
        this.io.to(`conversation:${data.conversationId}`).emit('chat:message', {
          ...message,
          sender: {
            id: socket.userId,
            name: socket.user.name,
            avatar: socket.user.avatar
          }
        });

        // Send notification to offline users
        await this.sendMessageNotifications(message, data.conversationId);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('chat:typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit('chat:typing', {
        conversationId: data.conversationId,
        userId: socket.userId,
        userName: socket.user.name,
        isTyping: data.isTyping
      });
    });

    // Mark messages as read
    socket.on('chat:read', async (data: { conversationId: string; messageIds: string[] }) => {
      try {
        await this.chatService.markMessagesAsRead(data.conversationId, socket.userId!, data.messageIds);

        // Notify others about read status
        socket.to(`conversation:${data.conversationId}`).emit('chat:read', {
          conversationId: data.conversationId,
          userId: socket.userId,
          messageIds: data.messageIds
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });
  }

  private setupCallEvents(socket: AuthenticatedSocket) {
    // Initiate call
    socket.on('call:initiate', async (data: {
      receiverId: string;
      type: 'voice' | 'video';
      roomId?: string;
    }) => {
      try {
        const call = await this.callService.initiateCall(
          socket.userId!,
          {
            participantIds: [data.receiverId],
            type: data.type,
            metadata: {}
          }
        );

        // Track caller for this call to notify later on accept/reject
        this.callCallerMap.set(call._id.toString(), socket.userId!);

        // Send call request to receiver
        const receiverSocketId = this.connectedUsers.get(data.receiverId);
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('call:incoming', {
            callId: call._id,
            callerId: socket.userId,
            callerName: socket.user.name,
            type: data.type,
            roomId: call.roomId
          });
        } else {
          // Send notification to offline user
          await this.notificationService.createNotification(
            data.receiverId,
            'call',
            'Incoming Call',
            `${socket.user.name} is calling you`,
            {
              callId: call._id,
              actionUrl: `/calls/${call._id}`,
              priority: 'high'
            }
          );
        }

        socket.emit('call:initiated', { callId: call._id, roomId: call.roomId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to initiate call' });
      }
    });

    // Accept call
    socket.on('call:accept', async (data: { callId: string }) => {
      try {
        const call = await this.callService.acceptCall(data.callId, socket.userId!);

        // Notify caller
        const callerId = this.callCallerMap.get(data.callId);
        const callerSocketId = callerId ? this.connectedUsers.get(callerId) : undefined;
        if (callerSocketId) {
          this.io.to(callerSocketId).emit('call:accepted', {
            callId: data.callId,
            receiverId: socket.userId,
            receiverName: socket.user.name
          });
        }

        // Join call room
        socket.join(`call:${data.callId}`);
        socket.emit('call:accepted', { callId: data.callId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to accept call' });
      }
    });

    // Reject call
    socket.on('call:reject', async (data: { callId: string; reason?: string }) => {
      try {
        await this.callService.rejectCall(data.callId, socket.userId!, data.reason);

        // Notify caller
        const callerId = this.callCallerMap.get(data.callId);
        const callerSocketId = callerId ? this.connectedUsers.get(callerId) : undefined;
        if (callerSocketId) {
          this.io.to(callerSocketId).emit('call:rejected', {
            callId: data.callId,
            receiverId: socket.userId,
            receiverName: socket.user.name,
            reason: data.reason
          });
        }

        socket.emit('call:rejected', { callId: data.callId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to reject call' });
      }
    });

    // End call
    socket.on('call:end', async (data: { callId: string }) => {
      try {
        const call = await this.callService.endCall(data.callId, socket.userId!);

        // Notify all participants
        this.io.to(`call:${data.callId}`).emit('call:ended', {
          callId: data.callId,
          endedBy: socket.userId,
          endedByName: socket.user.name,
          duration: call.durationSec
        });

        // Leave call room
        socket.leave(`call:${data.callId}`);

        // Cleanup caller map
        this.callCallerMap.delete(data.callId);
      } catch (error) {
        socket.emit('error', { message: 'Failed to end call' });
      }
    });

    // WebRTC signaling
    socket.on('webrtc:offer', (data: { callId: string; offer: any; targetId: string }) => {
      const targetSocketId = this.connectedUsers.get(data.targetId);
      if (targetSocketId) {
        this.io.to(targetSocketId).emit('webrtc:offer', {
          callId: data.callId,
          offer: data.offer,
          fromId: socket.userId
        });
      }
    });

    socket.on('webrtc:answer', (data: { callId: string; answer: any; targetId: string }) => {
      const targetSocketId = this.connectedUsers.get(data.targetId);
      if (targetSocketId) {
        this.io.to(targetSocketId).emit('webrtc:answer', {
          callId: data.callId,
          answer: data.answer,
          fromId: socket.userId
        });
      }
    });

    socket.on('webrtc:ice', (data: { callId: string; candidate: any; targetId: string }) => {
      const targetSocketId = this.connectedUsers.get(data.targetId);
      if (targetSocketId) {
        this.io.to(targetSocketId).emit('webrtc:ice', {
          callId: data.callId,
          candidate: data.candidate,
          fromId: socket.userId
        });
      }
    });
  }

  private setupPresenceEvents(socket: AuthenticatedSocket) {
    // User is online
    socket.emit('presence:online', {
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date()
    });

    // Notify others about user coming online
    socket.broadcast.emit('presence:online', {
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date()
    });

    // Handle user status updates
    socket.on('presence:status', (data: { status: 'online' | 'away' | 'busy' | 'offline' }) => {
      socket.broadcast.emit('presence:status', {
        userId: socket.userId,
        userName: socket.user.name,
        status: data.status,
        timestamp: new Date()
      });
    });
  }

  private async sendMessageNotifications(message: any, conversationId: string) {
    try {
      const conversation = await this.chatService.getConversationById(conversationId, message.senderId);
      if (!conversation) return;

      // Get participants who are not the sender
      const participants = conversation.participants.filter(
        (p: any) => p.toString() !== message.senderId.toString()
      );

      for (const participantId of participants) {
        const participantSocketId = this.connectedUsers.get(participantId.toString());

        if (!participantSocketId) {
          // User is offline, send notification
          await this.notificationService.createNotification(
            participantId.toString(),
            'message',
            `New message from ${message.sender.name}`,
            message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
            {
              conversationId,
              messageId: message._id,
              actionUrl: `/chat/${conversationId}`,
              priority: 'medium'
            }
          );
        }
      }
    } catch (error) {
      console.error('Error sending message notifications:', error);
    }
  }

  // Public methods for external use
  public getIO(): SocketIOServer {
    return this.io;
  }

  public sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public sendToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
