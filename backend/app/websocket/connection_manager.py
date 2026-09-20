import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("skillswap.websocket")


class ConnectionManager:
    def __init__(self):
        # conversation_id -> list of active WebSocket connections
        self.active_rooms: Dict[str, List[WebSocket]] = {}
        # user_id -> set of active WebSocket connections across rooms
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        # user_id -> online boolean
        self.online_users: Set[str] = set()

    async def connect(self, websocket: WebSocket, conversation_id: str, user_id: str):
        await websocket.accept()
        if conversation_id not in self.active_rooms:
            self.active_rooms[conversation_id] = []
        self.active_rooms[conversation_id].append(websocket)

        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)
        self.online_users.add(user_id)

        # Broadcast online status
        await self.broadcast_to_room(conversation_id, {
            "type": "presence",
            "user_id": user_id,
            "status": "online"
        })

    def disconnect(self, websocket: WebSocket, conversation_id: str, user_id: str):
        if conversation_id in self.active_rooms:
            if websocket in self.active_rooms[conversation_id]:
                self.active_rooms[conversation_id].remove(websocket)
            if not self.active_rooms[conversation_id]:
                del self.active_rooms[conversation_id]

        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
                self.online_users.discard(user_id)

    async def broadcast_to_room(self, conversation_id: str, message: Dict[str, Any]):
        """Send message payload to all active clients in a conversation room."""
        if conversation_id in self.active_rooms:
            text = json.dumps(message, default=str)
            dead_sockets = []
            for connection in self.active_rooms[conversation_id]:
                try:
                    await connection.send_text(text)
                except Exception as e:
                    logger.warning(f"Error sending message to websocket: {e}")
                    dead_sockets.append(connection)
            for dead in dead_sockets:
                if dead in self.active_rooms[conversation_id]:
                    self.active_rooms[conversation_id].remove(dead)

    def is_user_online(self, user_id: str) -> bool:
        return user_id in self.online_users


manager = ConnectionManager()
