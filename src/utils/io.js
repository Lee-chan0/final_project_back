import { Server } from 'socket.io'
import userController from '../Controllers/user.controller.js';
import chatController from '../Controllers/chat.controller.js';

const initializeSocketIO = function (server) {
  const io = new Server(server, {
    path: '/community/chat', // 해당 경로로 소켓 연결 설정
    cors: {
      origin: ['http://localhost:3000','https://nine-cloud9.vercel.app'],
      credentials: true,
    },
  });

  io.on('connection', async (socket) => {
    console.log('Client connected', socket.id);

    socket.on('login', async (userName, cb) => {
      try {
        const user = await userController.saveUser(userName, socket.id);
        connectedUsers[socket.id] = user;

        io.emit('connectedUsers', Object.values(connectedUsers).map(user => user.name))
        
        const welcomeMessage = {
          chat: `${(user.name).split(".")[0]} has joined the chat room`,
          user: { id: null, name: 'system' },
        };
        io.emit('message', welcomeMessage);
        cb({ ok: true, data: user });
      } catch (error) {
        cb({ ok: false, error: error.message });
      }
    });

    socket.on('sendMessage', async (message, cb) => {
      try {
        const user = await userController.checkUser(socket.id);
        const newMessage = await chatController.saveChat(message, user);
        io.emit('message', newMessage);
        cb({ ok: true });
      } catch (error) {
        cb({ ok: false, error: error.message });
      }
    });

    socket.on('disconnect', async () => {
      const user = await userController.checkUser(socket.id);
      if (user) {
        delete connectedUsers[socket.id]

        io.emit('connectedUsers', Object.values(connectedUsers).map(user => user.name))
        const leavingMessage = {
          chat: `${(user.name).split(".")[0]} has left the chat room`,
          user: { id: null, name: 'system' },
        };
        io.emit('message', leavingMessage);
      }
    });
  });
}

export default initializeSocketIO