from rest_framework import serializers
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from .models import MessageThread, Message, EncryptionKey, CallLog, MessageReaction, Device, MessageReadStatus, SyncCheckpoint, MessageBackup

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email']

class EncryptionKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = EncryptionKey
        fields = ['user', 'public_key', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class MessageReactionSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = MessageReaction
        fields = ['id', 'user', 'user_name', 'emoji', 'created_at']
        read_only_fields = ['id', 'created_at']

    @extend_schema_field(str)
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"


class MessagingMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    is_from_current_user = serializers.SerializerMethodField()
    reply_to_message = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    forwarded_from_message = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'thread', 'sender', 'sender_name', 'content', 'encrypted_content',
            'iv', 'auth_tag', 'message_type', 'timestamp', 'is_read', 'read_at',
            'is_from_current_user', 'reply_to', 'reply_to_message', 'reactions',
            'is_starred', 'expires_at', 'forwarded_from', 'forwarded_from_message'
        ]
        read_only_fields = ['id', 'timestamp', 'sender_name', 'is_from_current_user', 'reply_to_message', 'reactions', 'forwarded_from_message']

    @extend_schema_field(str)
    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}"

    @extend_schema_field(bool)
    def get_is_from_current_user(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender == request.user
        return False

    @extend_schema_field(dict)
    def get_reply_to_message(self, obj):
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'content': obj.reply_to.content or '[Encrypted]',
                'sender_name': f"{obj.reply_to.sender.first_name} {obj.reply_to.sender.last_name}",
                'message_type': obj.reply_to.message_type
            }
        return None

    @extend_schema_field(dict)
    def get_reactions(self, obj):
        return obj.get_reactions_summary()

    @extend_schema_field(dict)
    def get_forwarded_from_message(self, obj):
        if obj.forwarded_from:
            return {
                'id': obj.forwarded_from.id,
                'sender_name': f"{obj.forwarded_from.sender.first_name} {obj.forwarded_from.sender.last_name}",
                'timestamp': obj.forwarded_from.timestamp
            }
        return None

class MessagingMessageThreadSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    admins = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    participant_count = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()

    class Meta:
        model = MessageThread
        fields = [
            'id', 'subject', 'description', 'thread_type', 'participants', 'admins',
            'created_by', 'created_at', 'updated_at', 'is_active', 'last_message',
            'unread_count', 'participant_count', 'can_manage'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    @extend_schema_field(int)
    def get_participant_count(self, obj):
        return obj.participants.count()

    @extend_schema_field(bool)
    def get_can_manage(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.can_user_manage(request.user)
        return False

    @extend_schema_field(dict)
    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return {
                'id': last_msg.id,
                'content': last_msg.content or '[Encrypted]',
                'sender_name': f"{last_msg.sender.first_name} {last_msg.sender.last_name}",
                'timestamp': last_msg.timestamp,
                'preview': (last_msg.content or '[Encrypted]')[:50]
            }
        return None

    @extend_schema_field(int)
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

class CreateMessageThreadSerializer(serializers.ModelSerializer):
    participants = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True
    )
    initial_message = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = MessageThread
        fields = ['subject', 'description', 'thread_type', 'participants', 'initial_message']

    def validate_participants(self, value):
        """Validate that the number of participants doesn't exceed WhatsApp's limit of 256"""
        if len(value) > 256:
            raise serializers.ValidationError("A group cannot have more than 256 participants.")
        return value

    def validate_thread_type(self, value):
        """Validate thread type based on number of participants"""
        if value == 'direct' and len(self.initial_data.get('participants', [])) > 1:
            raise serializers.ValidationError("Direct messages can only have one participant.")
        return value

    def create(self, validated_data):
        participants_ids = validated_data.pop('participants')
        initial_message = validated_data.pop('initial_message', None)

        # Additional validation: ensure we don't exceed 256 total participants (including creator)
        if len(participants_ids) >= 256:  # >= because creator will be added
            raise serializers.ValidationError("A group cannot have more than 256 participants.")

        # Create thread
        thread = MessageThread.objects.create(
            **validated_data,
            created_by=self.context['request'].user
        )

        # Add participants using the new method
        participants = User.objects.filter(id__in=participants_ids)
        for participant in participants:
            thread.add_participant(participant, thread.created_by)

        # Add creator as participant and admin
        thread.add_participant(thread.created_by, thread.created_by)
        thread.admins.add(thread.created_by)

        # Create initial message if provided
        if initial_message:
            Message.objects.create(
                thread=thread,
                sender=self.context['request'].user,
                content=initial_message,
                message_type='text'
            )

        return thread

class CallLogSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)

    class Meta:
        model = CallLog
        fields = [
            'id', 'thread', 'initiator', 'participants', 'call_type',
            'status', 'started_at', 'ended_at', 'duration', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'started_at', 'ended_at', 'duration']

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = [
            'id', 'device_id', 'device_name', 'device_type',
            'user_agent', 'ip_address', 'last_seen', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'last_seen', 'created_at']


class MessageReadStatusSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.device_name', read_only=True)

    class Meta:
        model = MessageReadStatus
        fields = ['id', 'message', 'user', 'device', 'device_name', 'read_at']
        read_only_fields = ['id', 'read_at']


class SyncCheckpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncCheckpoint
        fields = ['id', 'device', 'last_message_id', 'last_sync_timestamp', 'created_at']
        read_only_fields = ['id', 'created_at']


class MessageBackupSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageBackup
        fields = [
            'id', 'backup_type', 'status', 'file_path', 'file_size',
            'message_count', 'media_count', 'checksum', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'file_path', 'file_size', 'message_count', 'media_count', 'checksum', 'created_at', 'completed_at']


class CreateCallLogSerializer(serializers.ModelSerializer):
    participants = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True
    )

    class Meta:
        model = CallLog
        fields = ['thread', 'participants', 'call_type']

    def create(self, validated_data):
        participants_ids = validated_data.pop('participants')

        call_log = CallLog.objects.create(
            **validated_data,
            initiator=self.context['request'].user,
            status='initiated'
        )

        # Add participants
        participants = User.objects.filter(id__in=participants_ids)
        call_log.participants.set(participants)

        return call_log