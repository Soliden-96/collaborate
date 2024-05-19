from django.test import TestCase
from django.urls import path
from channels.testing import HttpCommunicator, WebsocketCommunicator, ChannelsLiveServerTestCase
from channels.routing import URLRouter
from .consumers import ChatConsumer
from .models import  User, ExcalidrawInstance
import asyncio
import logging

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Test websocket functionality

class ChatTests(ChannelsLiveServerTestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='Testuser', password='password')
        self.client.login(username='Testuser', password='password')

    def tearDown(self): 
        self.client.logout()
        User.objects.all().delete()

    def test_room_name(self):
        return 4

    async def test_chat_message_sending(self):
        application = URLRouter([
            path("ws/chat/<room_name>/", ChatConsumer.as_asgi()),
        ])
        room_name = self.test_room_name()
        communicator = WebsocketCommunicator(application, f"/ws/chat/{room_name}/")

        # Set user in scope
        communicator.scope["user"] = self.user
        connected, subprotocol = await communicator.connect()
        assert connected

        chat_history = await communicator.receive_from()
        logger.debug(f"Chat history: {chat_history}")

        await asyncio.sleep(0.1)

        await communicator.send_json_to({"type": "chat.message", "message": "This is a test message"})
        response = await communicator.receive_json_from()
        logger.debug(f"Response: {response}")

        assert response.get("type") == "message"
        assert response.get("message")["message"] == "This is a test message"
        assert response.get("message")["sender"] == "Testuser"
        assert "timestamp" in response.get("message")

        await communicator.disconnect()

    async def test_chat_with_history(self):
        application = URLRouter([
            path("ws/chat/<room_name>/", ChatConsumer.as_asgi()),
        ])
        room_name = self.test_room_name()
        communicator = WebsocketCommunicator(application, f"/ws/chat/{room_name}/")
        connected, subprotocol = await communicator.connect()
        assert connected

        response = await communicator.receive_json_from()
        logger.debug(f"Response: {response}")

        assert response["type"] == "chat_history"
        assert "chat_history" in response

        await communicator.disconnect()

    async def test_multiple_clients(self):
        application = URLRouter([
            path("ws/chat/<room_name>/", ChatConsumer.as_asgi()),
        ])
        room_name = self.test_room_name()
        communicators = [WebsocketCommunicator(application, f"/ws/chat/{room_name}/") for user in range(3)]
        communicators[0].scope["user"] = self.user

        connected_results = await asyncio.gather(*(communicator.connect() for communicator in communicators))

        for connected, subprotocol in connected_results:
            assert connected

        for communicator in communicators:
            chat_history = await communicator.receive_from()
            logger.debug(f"Chat history: {chat_history}")

        await asyncio.sleep(0.1)

        await communicators[0].send_json_to({"type": "chat.message", "message": "This is a test message"})

        for communicator in communicators:
            response = await communicator.receive_json_from()
            logger.debug(f"Response: {response}")
            assert response.get("type") == "message"
            assert response.get("message")["message"] == "This is a test message"
            assert response.get("message")["sender"] == "Testuser"
            assert "timestamp" in response.get("message")

        await asyncio.gather(*[communicator.disconnect() for communicator in communicators])


