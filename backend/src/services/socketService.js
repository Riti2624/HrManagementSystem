let io;

function setSocketServer(server) {
  io = server;
}

function emitSocketEvent(event, payload) {
  if (io) {
    io.emit(event, payload);
  }
}

function emitDashboardRefresh(reason) {
  emitSocketEvent('dashboard:refresh', { reason, updatedAt: new Date().toISOString() });
}

module.exports = {
  setSocketServer,
  emitSocketEvent,
  emitDashboardRefresh
};
