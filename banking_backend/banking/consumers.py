import json
import logging
from datetime import timedelta
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import MessageThread, Message
from banking_backend.utils.monitoring import log_security_event, log_performance_metric

logger = logging.getLogger(__name__)

class MessagingConsumer(AsyncWebsocketConsumer):
    # Rate limiting: max messages per minute per user
    MESSAGE_RATE_LIMIT = 60
    CONNECTION_TIMEOUT = 3600  # 1 hour

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.message_count = 0
        self.last_message_time = None
        self.connection_start_time = None

    async def connect(self):
        try:
            # Get user from scope
            self.user = self.scope.get('user')
            if not self.user or not self.user.is_authenticated:
                logger.warning("Unauthenticated user attempted to connect to messaging")
                await self.close(code=4001)  # Unauthorized
                return

            # Check if user has staff role
            if self.user.role not in ['manager', 'operations_manager', 'cashier', 'mobile_banker']:
                logger.warning(f"Non-staff user {self.user.email} attempted to connect to messaging")
                await self.close(code=4003)  # Forbidden
                return

            self.room_id = self.scope['url_route']['kwargs']['thread_id']
            self.room_group_name = f'messaging_{self.room_id}'
            self.connection_start_time = timezone.now()

            # Validate thread access
            if not await self._validate_thread_access():
                logger.warning(f"User {self.user.email} attempted to access unauthorized thread {self.room_id}")
                await self.close(code=4003)  # Forbidden
                return

            # Check connection limits (max connections per user)
            active_connections = await self._get_active_connections_count()
            if active_connections >= 5:  # Reasonable limit
                logger.warning(f"User {self.user.email} exceeded connection limit")
                await self.close(code=4009)  # Too many connections
                return

            # Try to add to channel layer group (for Redis-based broadcasting)
            try:
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                self.redis_available = True
            except Exception as e:
                logger.warning(f"Redis not available for messaging, falling back to direct messaging: {str(e)}")
                self.redis_available = False
                # Disable channel layer to prevent further Redis connection attempts
                self.channel_layer = None
                self.channel_receive = None

            await self.accept()
            logger.info(f"User {self.user.email} connected to messaging thread {self.room_id}")

            # Log connection for monitoring
            await self._log_connection_event('connected')

            # Log security event for WebSocket connection
            log_security_event(
                event_type='websocket_connection',
                severity='low',
                user_id=str(self.user.id),
                description=f'User connected to messaging thread {self.room_id}',
                thread_id=self.room_id,
                connection_type='messaging'
            )

        except Exception as e:
            logger.error(f"Error in messaging connect: {str(e)}")
            await self.close(code=4000)  # Internal error

    async def disconnect(self, close_code):
        try:
            if hasattr(self, 'room_group_name') and getattr(self, 'redis_available', True):
                try:
                    await self.channel_layer.group_discard(
                        self.room_group_name,
                        self.channel_name
                    )
                except Exception as e:
                    logger.warning(f"Failed to remove from channel group (Redis unavailable): {str(e)}")
            logger.info(f"User {getattr(self, 'user', 'unknown')} disconnected from messaging")
        except Exception as e:
            logger.error(f"Error in messaging disconnect: {str(e)}")

    async def receive(self, text_data):
        try:
            if not hasattr(self, 'user') or not self.user.is_authenticated:
                await self.close(code=4001)
                return

            # Rate limiting check
            if not await self._check_rate_limit():
                # Log rate limit violation
                log_security_event(
                    event_type='rate_limit_exceeded',
                    severity='medium',
                    user_id=str(self.user.id),
                    description=f'Rate limit exceeded for messaging in thread {self.room_id}',
                    thread_id=self.room_id,
                    message_count=self.message_count
                )

                await self.send(text_data=json.dumps({
                    'error': 'Rate limit exceeded. Please slow down.'
                }))
                return

            # Connection timeout check
            if self.connection_start_time and (timezone.now() - self.connection_start_time) > timedelta(seconds=self.CONNECTION_TIMEOUT):
                await self.close(code=4008)  # Policy violation
                return

            text_data_json = json.loads(text_data)

            # Validate required fields
            if 'encrypted_content' not in text_data_json:
                await self.send(text_data=json.dumps({
                    'error': 'encrypted_content is required'
                }))
                return

            encrypted_content = text_data_json['encrypted_content']
            iv = text_data_json.get('iv', '')
            auth_tag = text_data_json.get('auth_tag', '')

            # Basic validation of encrypted content
            if not encrypted_content or not isinstance(encrypted_content, str):
                await self.send(text_data=json.dumps({
                    'error': 'Invalid encrypted content'
                }))
                return

            if len(encrypted_content) > 50000:  # Reasonable encrypted content length limit
                await self.send(text_data=json.dumps({
                    'error': 'Encrypted content too long (max 50000 characters)'
                }))
                return

            # Validate encryption format (basic checks)
            if not await self._validate_encryption_format(encrypted_content, iv, auth_tag):
                await self.send(text_data=json.dumps({
                    'error': 'Invalid encryption format'
                }))
                return

            # Save encrypted message
            start_time = timezone.now()
            saved_message = await self._save_encrypted_message(encrypted_content, iv, auth_tag)
            save_duration = (timezone.now() - start_time).total_seconds() * 1000

            # Update rate limiting
            self.message_count += 1
            self.last_message_time = timezone.now()

            # Log performance metrics for message saving
            log_performance_metric(
                operation='websocket_message_save',
                duration_ms=save_duration,
                success=True,
                user_id=str(self.user.id),
                transaction_id=f"msg_{saved_message['id']}",
                details={
                    'thread_id': self.room_id,
                    'message_type': 'encrypted',
                    'content_length': len(encrypted_content)
                }
            )

            # Broadcast encrypted message to room (only if Redis is available)
            if getattr(self, 'redis_available', True):
                try:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'new_message',
                            'message': saved_message,
                            'sender_id': str(self.user.id),
                            'timestamp': saved_message['timestamp']
                        }
                    )
                except Exception as e:
                    logger.warning(f"Failed to broadcast message via Redis (Redis unavailable): {str(e)}")
            else:
                logger.debug("Redis not available, skipping message broadcast")

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error in messaging receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'error': 'Failed to process message'
            }))

    async def chat_message(self, event):
        """Send message to WebSocket"""
        try:
            await self.send(text_data=json.dumps({
                'message': event['message'],
                'sender_id': event['sender_id'],
                'timestamp': event['timestamp']
            }))
        except Exception as e:
            logger.error(f"Error sending message to WebSocket: {str(e)}")

    async def new_message(self, event):
        """Handle new message broadcast"""
        try:
            # Only send to users who are not the sender
            if str(self.user.id) != event['message']['sender_id']:
                await self.send(text_data=json.dumps({
                    'type': 'new_message',
                    'message': event['message']
                }))
        except Exception as e:
            logger.error(f"Error sending new message to WebSocket: {str(e)}")

    @database_sync_to_async
    def _validate_thread_access(self):
        """Validate that user has access to this thread"""
        try:
            thread = MessageThread.objects.get(id=self.room_id)
            return thread.participants.filter(id=self.user.id).exists()
        except MessageThread.DoesNotExist:
            return False
        except Exception as e:
            logger.error(f"Error validating thread access: {str(e)}")
            return False

    @database_sync_to_async
    def _validate_encryption_format(self, encrypted_content, iv, auth_tag):
        """Validate the format of encrypted message data"""
        try:
            # Basic format validation
            if not isinstance(encrypted_content, str) or len(encrypted_content) == 0:
                logger.warning("Encrypted content is empty or not a string")
                return False

            # Check content length limits
            if len(encrypted_content) > 50000:
                logger.warning(f"Encrypted content too long: {len(encrypted_content)} characters")
                return False

            # For AES-GCM, IV should be 12 bytes (24 hex chars) if provided
            if iv:
                if not isinstance(iv, str):
                    logger.warning("IV is not a string")
                    return False
                if len(iv) != 24:
                    logger.warning(f"IV length invalid: {len(iv)} (expected 24)")
                    return False
                # Validate hex format
                try:
                    bytes.fromhex(iv)
                except ValueError:
                    logger.warning("IV is not valid hex")
                    return False

            # Auth tag should be 16 bytes (32 hex chars) for AES-GCM if provided
            if auth_tag:
                if not isinstance(auth_tag, str):
                    logger.warning("Auth tag is not a string")
                    return False
                if len(auth_tag) != 32:
                    logger.warning(f"Auth tag length invalid: {len(auth_tag)} (expected 32)")
                    return False
                # Validate hex format
                try:
                    bytes.fromhex(auth_tag)
                except ValueError:
                    logger.warning("Auth tag is not valid hex")
                    return False

            # Validate encrypted content format (base64 or hex)
            try:
                import base64
                base64.b64decode(encrypted_content, validate=True)
            except Exception:
                # If it's not base64, check if it's hex-encoded
                try:
                    bytes.fromhex(encrypted_content)
                except ValueError:
                    logger.warning("Encrypted content is neither valid base64 nor hex")
                    return False

            # Additional security checks
            # Check for suspicious patterns that might indicate tampering
            suspicious_patterns = ['<script', 'javascript:', 'data:', 'vbscript:']
            content_lower = encrypted_content.lower()
            for pattern in suspicious_patterns:
                if pattern in content_lower:
                    logger.warning(f"Suspicious pattern detected in encrypted content: {pattern}")
                    return False

            return True

        except Exception as e:
            logger.error(f"Error validating encryption format: {str(e)}")
            return False

    @database_sync_to_async
    def _save_encrypted_message(self, encrypted_content, iv, auth_tag):
        """Save encrypted message to database with comprehensive error handling"""
        try:
            pass

            # Get thread with error handling
            try:
                thread = MessageThread.objects.get(id=self.room_id)
            except MessageThread.DoesNotExist:
                logger.error(f"Thread {self.room_id} not found for user {self.user.email}")
                raise ValueError("Message thread not found")

            # Verify user is still a participant (in case of concurrent changes)
            if not thread.participants.filter(id=self.user.id).exists():
                logger.warning(f"User {self.user.email} attempted to send message to thread {self.room_id} they no longer participate in")
                raise ValueError("User is not a participant in this thread")

            # Create message record with encrypted content
            try:
                message = Message.objects.create(
                    thread=thread,
                    sender=self.user,
                    encrypted_content=encrypted_content,
                    iv=iv,
                    auth_tag=auth_tag,
                    message_type='text'
                )
            except Exception as db_error:
                logger.error(f"Database error creating message: {str(db_error)}")
                raise ValueError("Failed to save message to database")

            # Update thread timestamp
            try:
                thread.update_last_message()
            except Exception as thread_error:
                logger.warning(f"Failed to update thread timestamp: {str(thread_error)}")
                # Don't fail the message save for this

            # Log successful message creation for audit
            logger.info(f"Message {message.id} created in thread {thread.id} by user {self.user.email}")

            return {
                'id': str(message.id),
                'encrypted_content': message.encrypted_content,
                'iv': message.iv,
                'auth_tag': message.auth_tag,
                'timestamp': message.timestamp.isoformat(),
                'message_type': message.message_type
            }

        except ValueError as ve:
            # Re-raise validation errors
            raise ve
        except Exception as e:
            logger.error(f"Unexpected error saving encrypted message: {str(e)}")
            raise ValueError("Failed to process message")

    @database_sync_to_async
    def _check_rate_limit(self):
        """Check if user has exceeded message rate limit"""
        try:
            now = timezone.now()

            # Reset counter if it's been more than a minute
            if self.last_message_time and (now - self.last_message_time) > timedelta(minutes=1):
                self.message_count = 0

            # Check rate limit
            if self.message_count >= self.MESSAGE_RATE_LIMIT:
                logger.warning(f"Rate limit exceeded for user {self.user.email}")
                return False

            return True

        except Exception as e:
            logger.error(f"Error checking rate limit: {str(e)}")
            return False  # Fail safe - block if we can't check

    @database_sync_to_async
    def _get_active_connections_count(self):
        """Get count of active connections for this user (simplified implementation)"""
        try:
            # In a production system, you'd use Redis or database to track active connections
            # For now, return 0 (no limit enforcement)
            return 0
        except Exception as e:
            logger.error(f"Error getting active connections count: {str(e)}")
            return 0

    @database_sync_to_async
    def _log_connection_event(self, event_type):
        """Log connection events for monitoring"""
        try:
            logger.info(f"Messaging connection event: {event_type} for user {self.user.email} in thread {self.room_id}")
            # In production, you might want to store this in a database for monitoring
        except Exception as e:
            logger.error(f"Error logging connection event: {str(e)}")